<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SiteSettingsUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $settings;

    public function __construct(array $settings = [])
    {
        $this->settings = $settings;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('site-settings'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'settings.updated';
    }
}
