import sys, os, warnings
warnings.filterwarnings('ignore')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
sys.path.insert(0, os.path.dirname(__file__))
os.chdir(os.path.dirname(__file__))

from data_loader import load_service_stats, load_product_sales

df = load_service_stats()
print("=== SERVICE STATS ===")
print(df[['name','price','times_availed']].to_string())

print("\n=== PRODUCT SALES (first 5) ===")
df2 = load_product_sales()
print(df2[['name','category','stock','avg_daily_sales']].head(5).to_string())
