<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ServiceUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $action;
    public array $service;

    public function __construct(string $action, array $service = [])
    {
        $this->action = $action;
        $this->service = $service;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('services'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'service.updated';
    }
}
