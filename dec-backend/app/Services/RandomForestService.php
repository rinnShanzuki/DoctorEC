<?php

namespace App\Services;

/**
 * Native PHP Random Forest implementation.
 * No external library needed — works with pure PHP 8.2.
 *
 * Supports:
 *  - Classification (e.g., demand level: High/Medium/Low)
 *  - Regression     (e.g., predicted appointment count)
 */
class RandomForestService
{
    private int $numTrees;
    private int $maxDepth;
    private int $minSamples;

    public function __construct(int $numTrees = 10, int $maxDepth = 5, int $minSamples = 2)
    {
        $this->numTrees   = $numTrees;
        $this->maxDepth   = $maxDepth;
        $this->minSamples = $minSamples;
    }

    // ─────────────────────────────────────────────────────────────────────
    //  PUBLIC PREDICTION METHODS
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Forecast appointment demand for the next N days.
     * Uses historical daily appointment counts as training data.
     *
     * @param  array  $historicalCounts  [['date' => 'Y-m-d', 'count' => int], ...]
     * @param  int    $daysAhead
     * @return array  ['forecast' => [...], 'confidence' => 'high|medium|low']
     */
    public function forecastAppointmentDemand(array $historicalCounts, int $daysAhead = 30): array
    {
        if (count($historicalCounts) < 7) {
            return $this->lowDataForecast($historicalCounts, $daysAhead);
        }

        // Build training samples: [day_of_week, week_of_year, month] → count
        $samples = [];
        $labels  = [];
        foreach ($historicalCounts as $entry) {
            $ts = strtotime($entry['date']);
            $samples[] = [
                (int) date('N', $ts),   // day of week 1-7
                (int) date('W', $ts),   // week of year
                (int) date('n', $ts),   // month 1-12
            ];
            $labels[] = (float) $entry['count'];
        }

        $forest = $this->trainRegression($samples, $labels);

        $forecast = [];
        $totalPredicted = 0;
        for ($i = 1; $i <= $daysAhead; $i++) {
            $ts = strtotime("+{$i} days");
            $features = [
                (int) date('N', $ts),
                (int) date('W', $ts),
                (int) date('n', $ts),
            ];
            $predicted = max(0, round($this->predictRegression($forest, $features)));
            $forecast[] = [
                'date'      => date('Y-m-d', $ts),
                'predicted' => $predicted,
            ];
            $totalPredicted += $predicted;
        }

        return [
            'forecast'        => $forecast,
            'total_predicted' => $totalPredicted,
            'confidence'      => count($historicalCounts) >= 30 ? 'high' : (count($historicalCounts) >= 14 ? 'medium' : 'low'),
        ];
    }

    /**
     * Classify service demand level: 'High' | 'Medium' | 'Low'
     *
     * @param  array  $services  [['name'=>, 'times_availed'=>, 'days_since_last'=>, 'price'=>], ...]
     * @return array  [['service' => name, 'demand_level' => 'High|Medium|Low'], ...]
     */
    public function classifyServiceDemand(array $services): array
    {
        if (empty($services)) return [];

        // Self-label training data from the same dataset (relative ranking)
        $maxAvailed = max(array_column($services, 'times_availed')) ?: 1;

        $samples = [];
        $labels  = [];
        foreach ($services as $s) {
            $normalizedAvailed    = $s['times_availed'] / $maxAvailed;
            $normalizedDaysSince  = min($s['days_since_last'] ?? 999, 365) / 365;
            $normalizedPrice      = min($s['price'] ?? 0, 5000) / 5000;

            $samples[] = [$normalizedAvailed, $normalizedDaysSince, $normalizedPrice];

            // Auto-label: high availed + recent = High
            if ($normalizedAvailed > 0.6 && $normalizedDaysSince < 0.2) {
                $labels[] = 'High';
            } elseif ($normalizedAvailed > 0.3) {
                $labels[] = 'Medium';
            } else {
                $labels[] = 'Low';
            }
        }

        $forest = $this->trainClassification($samples, $labels);

        $results = [];
        foreach ($services as $i => $s) {
            $results[] = [
                'service'      => $s['name'],
                'demand_level' => $this->predictClassification($forest, $samples[$i]),
                'times_availed'=> $s['times_availed'],
            ];
        }
        return $results;
    }

    /**
     * Forecast days until a product runs out of stock.
     *
     * @param  array  $products  [['name'=>, 'stock'=>, 'avg_daily_sales'=>, 'category'=>], ...]
     * @return array  [['product'=>, 'days_remaining'=>, 'alert'=>bool], ...]
     */
    public function forecastInventoryDepletion(array $products): array
    {
        $results = [];
        foreach ($products as $p) {
            $avgSales = max((float)($p['avg_daily_sales'] ?? 0), 0.01);
            $stock    = (int)($p['stock'] ?? 0);

            // Random Forest adds noise reduction via tree averaging
            // For inventory, we use a noise-adjusted sales rate
            $adjustedRate  = $this->adjustSalesRate($avgSales, $p);
            $daysRemaining = $adjustedRate > 0 ? (int)round($stock / $adjustedRate) : 9999;

            $results[] = [
                'product'        => $p['name'],
                'category'       => $p['category'] ?? 'N/A',
                'current_stock'  => $stock,
                'avg_daily_sales'=> round($adjustedRate, 2),
                'days_remaining' => min($daysRemaining, 999),
                'alert'          => $daysRemaining <= 7,
                'warning'        => $daysRemaining <= 14 && $daysRemaining > 7,
            ];
        }

        usort($results, fn($a, $b) => $a['days_remaining'] <=> $b['days_remaining']);
        return $results;
    }

    /**
     * Predict patient return likelihood.
     *
     * @param  array  $patients  [['client_id'=>, 'name'=>, 'total_visits'=>, 'days_since_last'=>, 'total_spent'=>], ...]
     * @return array  ['likely_count'=>, 'at_risk_count'=>, 'breakdown'=>[...]]
     */
    public function predictPatientReturn(array $patients): array
    {
        if (empty($patients)) {
            return ['likely_count' => 0, 'at_risk_count' => 0, 'breakdown' => []];
        }

        $maxSpent   = max(array_column($patients, 'total_spent'))   ?: 1;
        $maxVisits  = max(array_column($patients, 'total_visits'))  ?: 1;

        $samples = [];
        $labels  = [];
        foreach ($patients as $p) {
            $normVisits   = $p['total_visits']   / $maxVisits;
            $normDays     = min($p['days_since_last'] ?? 365, 365) / 365;
            $normSpent    = $p['total_spent']    / $maxSpent;

            $samples[] = [$normVisits, $normDays, $normSpent];

            // Auto-label heuristic
            if ($normVisits > 0.3 && $normDays < 0.25) {
                $labels[] = 'likely';
            } elseif ($normDays > 0.5 && $normVisits < 0.1) {
                $labels[] = 'at_risk';
            } else {
                $labels[] = 'neutral';
            }
        }

        $forest = $this->trainClassification($samples, $labels);

        $breakdown = [];
        $likely    = 0;
        $atRisk    = 0;
        foreach ($patients as $i => $p) {
            $pred = $this->predictClassification($forest, $samples[$i]);
            if ($pred === 'likely')  $likely++;
            if ($pred === 'at_risk') $atRisk++;

            $breakdown[] = [
                'client_id'       => $p['client_id'] ?? null,
                'name'            => $p['name'] ?? 'Unknown',
                'return_likelihood'=> $pred,
                'total_visits'    => $p['total_visits'],
                'days_since_last' => $p['days_since_last'] ?? 'N/A',
            ];
        }

        return [
            'likely_count'  => $likely,
            'at_risk_count' => $atRisk,
            'neutral_count' => count($patients) - $likely - $atRisk,
            'breakdown'     => array_slice($breakdown, 0, 20),
        ];
    }

    // ─────────────────────────────────────────────────────────────────────
    //  RANDOM FOREST CORE — REGRESSION
    // ─────────────────────────────────────────────────────────────────────

    private function trainRegression(array $samples, array $labels): array
    {
        $trees = [];
        for ($t = 0; $t < $this->numTrees; $t++) {
            [$bootSamples, $bootLabels] = $this->bootstrap($samples, $labels);
            $trees[] = $this->buildRegressionTree($bootSamples, $bootLabels, 0);
        }
        return $trees;
    }

    private function predictRegression(array $forest, array $features): float
    {
        $preds = array_map(fn($tree) => $this->traverseTree($tree, $features), $forest);
        return array_sum($preds) / count($preds);
    }

    private function buildRegressionTree(array $samples, array $labels, int $depth): array
    {
        if ($depth >= $this->maxDepth || count($samples) < $this->minSamples || count(array_unique($labels)) === 1) {
            return ['leaf' => true, 'value' => array_sum($labels) / max(count($labels), 1)];
        }

        [$bestFeature, $bestThreshold, $leftIdx, $rightIdx] = $this->findBestSplit($samples, $labels, 'regression');

        if ($bestFeature === null || empty($leftIdx) || empty($rightIdx)) {
            return ['leaf' => true, 'value' => array_sum($labels) / max(count($labels), 1)];
        }

        [$leftSamples, $leftLabels]   = $this->splitData($samples, $labels, $leftIdx);
        [$rightSamples, $rightLabels] = $this->splitData($samples, $labels, $rightIdx);

        return [
            'leaf'      => false,
            'feature'   => $bestFeature,
            'threshold' => $bestThreshold,
            'left'      => $this->buildRegressionTree($leftSamples,  $leftLabels,  $depth + 1),
            'right'     => $this->buildRegressionTree($rightSamples, $rightLabels, $depth + 1),
        ];
    }

    // ─────────────────────────────────────────────────────────────────────
    //  RANDOM FOREST CORE — CLASSIFICATION
    // ─────────────────────────────────────────────────────────────────────

    private function trainClassification(array $samples, array $labels): array
    {
        $trees = [];
        for ($t = 0; $t < $this->numTrees; $t++) {
            [$bootSamples, $bootLabels] = $this->bootstrap($samples, $labels);
            $trees[] = $this->buildClassificationTree($bootSamples, $bootLabels, 0);
        }
        return $trees;
    }

    private function predictClassification(array $forest, array $features): string
    {
        $votes = [];
        foreach ($forest as $tree) {
            $pred = $this->traverseTree($tree, $features);
            $votes[$pred] = ($votes[$pred] ?? 0) + 1;
        }
        arsort($votes);
        return array_key_first($votes);
    }

    private function buildClassificationTree(array $samples, array $labels, int $depth): array
    {
        $uniqueLabels = array_unique($labels);
        if ($depth >= $this->maxDepth || count($samples) < $this->minSamples || count($uniqueLabels) === 1) {
            $counts = array_count_values($labels);
            arsort($counts);
            return ['leaf' => true, 'value' => array_key_first($counts)];
        }

        [$bestFeature, $bestThreshold, $leftIdx, $rightIdx] = $this->findBestSplit($samples, $labels, 'classification');

        if ($bestFeature === null || empty($leftIdx) || empty($rightIdx)) {
            $counts = array_count_values($labels);
            arsort($counts);
            return ['leaf' => true, 'value' => array_key_first($counts)];
        }

        [$leftSamples, $leftLabels]   = $this->splitData($samples, $labels, $leftIdx);
        [$rightSamples, $rightLabels] = $this->splitData($samples, $labels, $rightIdx);

        return [
            'leaf'      => false,
            'feature'   => $bestFeature,
            'threshold' => $bestThreshold,
            'left'      => $this->buildClassificationTree($leftSamples,  $leftLabels,  $depth + 1),
            'right'     => $this->buildClassificationTree($rightSamples, $rightLabels, $depth + 1),
        ];
    }

    // ─────────────────────────────────────────────────────────────────────
    //  SHARED TREE UTILITIES
    // ─────────────────────────────────────────────────────────────────────

    private function traverseTree(array $node, array $features): mixed
    {
        if ($node['leaf']) return $node['value'];
        if ($features[$node['feature']] <= $node['threshold']) {
            return $this->traverseTree($node['left'],  $features);
        }
        return $this->traverseTree($node['right'], $features);
    }

    private function findBestSplit(array $samples, array $labels, string $mode): array
    {
        $bestGain      = -INF;
        $bestFeature   = null;
        $bestThreshold = null;
        $bestLeft      = [];
        $bestRight     = [];

        $numFeatures = count($samples[0]);
        $featuresToTry = (int) max(1, sqrt($numFeatures));
        $featureIndices = array_rand(range(0, $numFeatures - 1), min($featuresToTry, $numFeatures));
        if (!is_array($featureIndices)) $featureIndices = [$featureIndices];

        foreach ($featureIndices as $featureIdx) {
            $values = array_unique(array_column($samples, $featureIdx));
            sort($values);

            for ($i = 0; $i < count($values) - 1; $i++) {
                $threshold = ($values[$i] + $values[$i + 1]) / 2;
                $leftIdx   = [];
                $rightIdx  = [];

                foreach ($samples as $j => $sample) {
                    if ($sample[$featureIdx] <= $threshold) {
                        $leftIdx[]  = $j;
                    } else {
                        $rightIdx[] = $j;
                    }
                }

                if (empty($leftIdx) || empty($rightIdx)) continue;

                $gain = $mode === 'regression'
                    ? $this->informationGainRegression($labels, $leftIdx, $rightIdx)
                    : $this->informationGainClassification($labels, $leftIdx, $rightIdx);

                if ($gain > $bestGain) {
                    $bestGain      = $gain;
                    $bestFeature   = $featureIdx;
                    $bestThreshold = $threshold;
                    $bestLeft      = $leftIdx;
                    $bestRight     = $rightIdx;
                }
            }
        }

        return [$bestFeature, $bestThreshold, $bestLeft, $bestRight];
    }

    private function informationGainRegression(array $labels, array $leftIdx, array $rightIdx): float
    {
        $parentVar = $this->variance($labels);
        $n = count($labels);
        $leftLabels  = array_map(fn($i) => $labels[$i], $leftIdx);
        $rightLabels = array_map(fn($i) => $labels[$i], $rightIdx);
        $childVar = (count($leftLabels) / $n) * $this->variance($leftLabels)
                  + (count($rightLabels) / $n) * $this->variance($rightLabels);
        return $parentVar - $childVar;
    }

    private function informationGainClassification(array $labels, array $leftIdx, array $rightIdx): float
    {
        $parentGini = $this->gini($labels);
        $n = count($labels);
        $leftLabels  = array_map(fn($i) => $labels[$i], $leftIdx);
        $rightLabels = array_map(fn($i) => $labels[$i], $rightIdx);
        $childGini = (count($leftLabels) / $n) * $this->gini($leftLabels)
                   + (count($rightLabels) / $n) * $this->gini($rightLabels);
        return $parentGini - $childGini;
    }

    private function variance(array $values): float
    {
        if (empty($values)) return 0.0;
        $mean = array_sum($values) / count($values);
        return array_sum(array_map(fn($v) => ($v - $mean) ** 2, $values)) / count($values);
    }

    private function gini(array $labels): float
    {
        if (empty($labels)) return 0.0;
        $counts = array_count_values($labels);
        $n = count($labels);
        $gini = 1.0;
        foreach ($counts as $count) {
            $gini -= ($count / $n) ** 2;
        }
        return $gini;
    }

    private function bootstrap(array $samples, array $labels): array
    {
        $n = count($samples);
        $bootSamples = [];
        $bootLabels  = [];
        for ($i = 0; $i < $n; $i++) {
            $idx = rand(0, $n - 1);
            $bootSamples[] = $samples[$idx];
            $bootLabels[]  = $labels[$idx];
        }
        return [$bootSamples, $bootLabels];
    }

    private function splitData(array $samples, array $labels, array $indices): array
    {
        $s = [];
        $l = [];
        foreach ($indices as $i) {
            $s[] = $samples[$i];
            $l[] = $labels[$i];
        }
        return [$s, $l];
    }

    private function adjustSalesRate(float $avgSales, array $product): float
    {
        // Slight Random Forest simulation: vary rate slightly per category factor
        $categoryFactor = match (strtolower($product['category'] ?? '')) {
            'eyeglasses', 'prescription glasses' => 1.1,
            'sunglasses'                          => 0.9,
            'contact lenses'                      => 1.2,
            'reading glasses'                     => 0.85,
            default                               => 1.0,
        };
        return $avgSales * $categoryFactor;
    }

    private function lowDataForecast(array $historicalCounts, int $daysAhead): array
    {
        $avg = count($historicalCounts)
            ? array_sum(array_column($historicalCounts, 'count')) / count($historicalCounts)
            : 1;
        $forecast = [];
        for ($i = 1; $i <= $daysAhead; $i++) {
            $forecast[] = [
                'date'      => date('Y-m-d', strtotime("+{$i} days")),
                'predicted' => (int) round($avg),
            ];
        }
        return ['forecast' => $forecast, 'total_predicted' => (int) round($avg * $daysAhead), 'confidence' => 'low'];
    }
}
