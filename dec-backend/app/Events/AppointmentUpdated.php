<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AppointmentUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $action;
    public array $appointment;

    /**
     * Create a new event instance.
     * @param string $action  'created' | 'updated' | 'cancelled' | 'rescheduled'
     * @param array  $appointment  Appointment data
     */
    public function __construct(string $action, array $appointment = [])
    {
        $this->action = $action;
        $this->appointment = $appointment;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('appointments'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'appointment.updated';
    }
}
