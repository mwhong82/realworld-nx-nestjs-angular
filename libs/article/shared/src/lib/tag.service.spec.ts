import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { TagService } from './tag.service';
import { IConfigurationService } from '@realworld/shared/configuration';
import { IPageRequest, IQuery } from '@realworld/shared/foundation';

// ──────────────────────────────────────────────
// 테스트 픽스처
// ──────────────────────────────────────────────
const API_BASE = 'http://localhost:3000/api';

const mockTags = ['angular', 'nestjs', 'typescript', 'rxjs'];

const mockConfigService: Partial<IConfigurationService> = {
  configs$: of({ rest: { url: API_BASE } } as any),
};

// ──────────────────────────────────────────────
// 테스트 스위트
// ──────────────────────────────────────────────
describe('TagService (프론트엔드)', () => {
  let service: TagService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TagService,
        { provide: IConfigurationService, useValue: mockConfigService },
      ],
    });

    service = TestBed.inject(TagService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ──────────────────────────────────────────────
  // getAll()  — BaseDataService에서 상속, TagService의 유일한 공개 메서드
  // ──────────────────────────────────────────────
  describe('getAll()', () => {
    it('GET /tags 를 호출하고 태그 목록을 IPage 형태로 반환해야 한다', () => {
      const req: IPageRequest<string> = { pageIndex: 0, limit: 20 };
      const query: IQuery = {};

      service.getAll(req, query).subscribe(page => {
        expect(page.data).toEqual(mockTags);
        expect(page.total).toBe(mockTags.length);
        expect(page.pageIndex).toBe(0);
        expect(page.limit).toBe(20);
      });

      const httpReq = httpMock.expectOne(r => r.url === `${API_BASE}/tags`);
      expect(httpReq.request.method).toBe('GET');
      httpReq.flush({ success: true, listData: mockTags, total: mockTags.length });
    });

    it('limit 파라미터가 쿼리스트링에 포함되어야 한다', () => {
      service.getAll({ pageIndex: 0, limit: 50 }, {}).subscribe();

      const httpReq = httpMock.expectOne(r => r.url === `${API_BASE}/tags`);
      expect(httpReq.request.params.get('limit')).toBe('50');
      httpReq.flush({ success: true, listData: mockTags, total: mockTags.length });
    });

    it('offset 파라미터가 올바르게 계산되어야 한다 (pageIndex * limit)', () => {
      // pageIndex=1, limit=10 → offset=10
      service.getAll({ pageIndex: 1, limit: 10 }, {}).subscribe();

      const httpReq = httpMock.expectOne(r => r.url === `${API_BASE}/tags`);
      expect(httpReq.request.params.get('offset')).toBe('10');
      httpReq.flush({ success: true, listData: [], total: 0 });
    });

    it('태그가 없으면 빈 data 배열을 반환해야 한다', () => {
      service.getAll({ pageIndex: 0, limit: 10 }, {}).subscribe(page => {
        expect(page.data).toEqual([]);
        expect(page.total).toBe(0);
      });

      const httpReq = httpMock.expectOne(r => r.url === `${API_BASE}/tags`);
      httpReq.flush({ success: true, listData: [], total: 0 });
    });

    it('loading=false이면 not-show 헤더가 설정되어야 한다', () => {
      service.getAll({ pageIndex: 0, limit: 10 }, {}, false).subscribe();

      const httpReq = httpMock.expectOne(r => r.url === `${API_BASE}/tags`);
      expect(httpReq.request.headers.get('loading')).toBe('not-show');
      httpReq.flush({ success: true, listData: [], total: 0 });
    });

    it('요청 헤더에 Content-Type이 application/json으로 설정되어야 한다', () => {
      service.getAll({ pageIndex: 0, limit: 10 }, {}).subscribe();

      const httpReq = httpMock.expectOne(r => r.url === `${API_BASE}/tags`);
      expect(httpReq.request.headers.get('Content-Type')).toBe('application/json');
      httpReq.flush({ success: true, listData: mockTags, total: mockTags.length });
    });
  });

  // ──────────────────────────────────────────────
  // getOne()  — BaseDataService에서 상속
  // ──────────────────────────────────────────────
  describe('getOne()', () => {
    it('GET /tags/:id 를 호출하여 단일 태그를 반환해야 한다', () => {
      service.getOne('angular').subscribe(res => {
        expect(res.detailData).toBe('angular');
      });

      const req = httpMock.expectOne(`${API_BASE}/tags/angular`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, detailData: 'angular' });
    });
  });

  // ──────────────────────────────────────────────
  // endpoint 확인
  // ──────────────────────────────────────────────
  describe('엔드포인트 설정', () => {
    it('TagService가 올바르게 인스턴스화되어야 한다', () => {
      expect(service).toBeTruthy();
    });

    it('연속 두 번 getAll() 을 호출해도 각각 독립적인 요청이어야 한다', () => {
      service.getAll({ pageIndex: 0, limit: 5 }, {}).subscribe();
      service.getAll({ pageIndex: 1, limit: 5 }, {}).subscribe();

      const requests = httpMock.match(r => r.url === `${API_BASE}/tags`);
      expect(requests.length).toBe(2);
      requests[0].flush({ success: true, listData: mockTags.slice(0, 2), total: 4 });
      requests[1].flush({ success: true, listData: mockTags.slice(2, 4), total: 4 });
    });
  });
});
