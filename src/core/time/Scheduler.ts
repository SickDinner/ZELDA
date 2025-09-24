export type ScheduledTask = () => void;

export interface ScheduledEvent {
  id: string;
  task: ScheduledTask;
  delay: number;
  repeat: boolean;
  repeatInterval?: number;
  timeRemaining: number;
  active: boolean;
}

export class Scheduler {
  private events: Map<string, ScheduledEvent> = new Map();
  private nextId: number = 1;

  public update(dt: number): void {
    for (const [id, event] of this.events) {
      if (!event.active) continue;

      event.timeRemaining -= dt;

      if (event.timeRemaining <= 0) {
        // Execute the task
        event.task();

        if (event.repeat && event.repeatInterval !== undefined) {
          // Reset for next execution
          event.timeRemaining = event.repeatInterval;
        } else {
          // Remove one-time event
          this.events.delete(id);
        }
      }
    }
  }

  public schedule(
    task: ScheduledTask,
    delay: number,
    options: {
      id?: string;
      repeat?: boolean;
      repeatInterval?: number;
    } = {}
  ): string {
    const id = options.id || `task_${this.nextId++}`;
    
    const event: ScheduledEvent = {
      id,
      task,
      delay,
      repeat: options.repeat ?? false,
      repeatInterval: options.repeatInterval,
      timeRemaining: delay,
      active: true
    };

    this.events.set(id, event);
    return id;
  }

  public scheduleRepeating(
    task: ScheduledTask,
    interval: number,
    options: { id?: string; initialDelay?: number } = {}
  ): string {
    return this.schedule(task, options.initialDelay ?? interval, {
      id: options.id,
      repeat: true,
      repeatInterval: interval
    });
  }

  public cancel(id: string): boolean {
    return this.events.delete(id);
  }

  public pause(id: string): boolean {
    const event = this.events.get(id);
    if (event) {
      event.active = false;
      return true;
    }
    return false;
  }

  public resume(id: string): boolean {
    const event = this.events.get(id);
    if (event) {
      event.active = true;
      return true;
    }
    return false;
  }

  public clear(): void {
    this.events.clear();
  }

  public hasEvent(id: string): boolean {
    return this.events.has(id);
  }

  public getEventCount(): number {
    return this.events.size;
  }

  public getRemainingTime(id: string): number | null {
    const event = this.events.get(id);
    return event ? event.timeRemaining : null;
  }
}

// Global scheduler instance
export const globalScheduler = new Scheduler();