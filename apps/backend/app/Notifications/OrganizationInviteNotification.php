<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class OrganizationInviteNotification extends Notification implements ShouldBroadcast {
    use Queueable;

    public function __construct(public string $orgName, public string $inviterName) {
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array {
        return ['database', 'broadcast'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage {
        return (new MailMessage)
            ->line("You have been added to {$this->orgName} by {$this->inviterName}.")
            ->action('View Organization', url('/'))
            ->line('Thank you for using our application!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array {
        return [
            'title' => 'Organization Invitation',
            'message' => "You have been added to {$this->orgName} by {$this->inviterName}.",
            'type' => 'organization_invite',
            'org_name' => $this->orgName,
            'inviter_name' => $this->inviterName,
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage {
        return new BroadcastMessage([
            'title' => 'Organization Invitation',
            'message' => "You have been added to {$this->orgName} by {$this->inviterName}.",
            'org_name' => $this->orgName,
            'inviter_name' => $this->inviterName,
        ]);
    }
}
