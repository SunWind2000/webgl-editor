import { Controller, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { MessageEvent } from '@nestjs/common';

@Controller()
export class EventsController {
  @Sse('events')
  streamEvents(): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      subscriber.next({
        type: 'server.ready',
        data: {
          service: '@webgl-editor/server',
          version: '0.1.0',
          timestamp: new Date().toISOString()
        }
      });

      const interval = setInterval(() => {
        subscriber.next({
          type: 'heartbeat',
          data: {
            timestamp: new Date().toISOString()
          }
        });
      }, 15_000);

      return () => clearInterval(interval);
    });
  }
}
