import { HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { ErrorInterceptor } from './error.interceptor';

describe('ErrorInterceptor', () => {
  let interceptor: ErrorInterceptor;
  let mockNext: jest.Mocked<HttpHandler>;

  beforeEach(() => {
    interceptor = new ErrorInterceptor();

    mockNext = {
      handle: jest.fn().mockReturnValue(of({} as HttpEvent<unknown>)),
    };
  });

  describe('intercept', () => {
    it('GET 요청 성공 시 응답을 그대로 반환해야 한다', (done) => {
      const mockEvent = {} as HttpEvent<unknown>;
      mockNext.handle.mockReturnValue(of(mockEvent));

      const request = new HttpRequest('GET', '/api/test');
      interceptor.intercept(request, mockNext).subscribe({
        next: (event) => {
          expect(event).toBe(mockEvent);
          done();
        },
      });
    });

    it('GET 요청 실패 시 retry(3) 파이프가 적용되어야 한다', (done) => {
      // retry(3)은 Observable 구독을 3번 재시도한다
      // mockNext.handle이 매번 새 에러 Observable을 반환하도록 설정
      let subscribeCount = 0;
      mockNext.handle.mockImplementation(() => {
        return new Observable((observer) => {
          subscribeCount++;
          observer.error(new HttpErrorResponse({ status: 500 }));
        });
      });

      const request = new HttpRequest('GET', '/api/test');
      interceptor.intercept(request, mockNext).subscribe({
        error: () => {
          // 원본 1번 + 재시도 3번 = 총 4번 구독
          expect(subscribeCount).toBe(4);
          done();
        },
      });
    });

    it('POST 요청 실패 시 재시도하지 않아야 한다 (retry 0)', (done) => {
      let subscribeCount = 0;
      mockNext.handle.mockImplementation(() => {
        return new Observable((observer) => {
          subscribeCount++;
          observer.error(new HttpErrorResponse({ status: 500 }));
        });
      });

      const request = new HttpRequest('POST', '/api/test', {});
      interceptor.intercept(request, mockNext).subscribe({
        error: () => {
          expect(subscribeCount).toBe(1);
          done();
        },
      });
    });

    it('PUT 요청 실패 시 재시도하지 않아야 한다 (retry 0)', (done) => {
      let subscribeCount = 0;
      mockNext.handle.mockImplementation(() => {
        return new Observable((observer) => {
          subscribeCount++;
          observer.error(new HttpErrorResponse({ status: 400 }));
        });
      });

      const request = new HttpRequest('PUT', '/api/test', {});
      interceptor.intercept(request, mockNext).subscribe({
        error: () => {
          expect(subscribeCount).toBe(1);
          done();
        },
      });
    });

    it('DELETE 요청 실패 시 재시도하지 않아야 한다 (retry 0)', (done) => {
      let subscribeCount = 0;
      mockNext.handle.mockImplementation(() => {
        return new Observable((observer) => {
          subscribeCount++;
          observer.error(new HttpErrorResponse({ status: 404 }));
        });
      });

      const request = new HttpRequest('DELETE', '/api/test');
      interceptor.intercept(request, mockNext).subscribe({
        error: () => {
          expect(subscribeCount).toBe(1);
          done();
        },
      });
    });

    it('next.handle을 올바른 요청으로 호출해야 한다', () => {
      const request = new HttpRequest('GET', '/api/articles');
      interceptor.intercept(request, mockNext).subscribe();

      expect(mockNext.handle).toHaveBeenCalledWith(request);
    });

    it('GET 요청이 재시도 후 성공하면 결과를 반환해야 한다', (done) => {
      const mockEvent = {} as HttpEvent<unknown>;
      let subscribeCount = 0;
      mockNext.handle.mockImplementation(() => {
        return new Observable((observer) => {
          subscribeCount++;
          if (subscribeCount < 3) {
            observer.error(new HttpErrorResponse({ status: 500 }));
          } else {
            observer.next(mockEvent);
            observer.complete();
          }
        });
      });

      const request = new HttpRequest('GET', '/api/test');
      interceptor.intercept(request, mockNext).subscribe({
        next: (event) => {
          expect(event).toBe(mockEvent);
          expect(subscribeCount).toBe(3);
          done();
        },
      });
    });

    it('PATCH 요청 실패 시 재시도하지 않아야 한다 (retry 0)', (done) => {
      let subscribeCount = 0;
      mockNext.handle.mockImplementation(() => {
        return new Observable((observer) => {
          subscribeCount++;
          observer.error(new HttpErrorResponse({ status: 422 }));
        });
      });

      const request = new HttpRequest('PATCH', '/api/test', {});
      interceptor.intercept(request, mockNext).subscribe({
        error: () => {
          expect(subscribeCount).toBe(1);
          done();
        },
      });
    });
  });
});
