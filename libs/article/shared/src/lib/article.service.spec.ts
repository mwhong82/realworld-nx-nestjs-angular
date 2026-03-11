import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { ArticleService } from './article.service';
import { IConfigurationService } from '@realworld/shared/configuration';
import { IArticle } from '@realworld/article/api-interfaces';
import { ActionSuccessResponse } from '@realworld/shared/client-server';
import { IPageRequest, IQuery } from '@realworld/shared/foundation';

// ──────────────────────────────────────────────
// 테스트 픽스처
// ──────────────────────────────────────────────
const API_BASE = 'http://localhost:3000/api';

const mockArticle: IArticle = {
  id: 'article-uuid-001',
  slug: 'test-article',
  title: '테스트 게시글',
  description: '테스트 설명',
  body: '테스트 본문',
  tagList: ['angular', 'nestjs'],
  favorited: false,
  favoritesCount: 0,
  author: {
    id: 'user-uuid-001',
    username: 'testuser',
    bio: '',
    image: '',
    following: false,
  } as any,
} as IArticle;

const mockConfigService: Partial<IConfigurationService> = {
  configs$: of({ rest: { url: API_BASE } } as any),
};

// ──────────────────────────────────────────────
// 테스트 스위트
// ──────────────────────────────────────────────
describe('ArticleService (프론트엔드)', () => {
  let service: ArticleService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ArticleService,
        { provide: IConfigurationService, useValue: mockConfigService },
      ],
    });

    service = TestBed.inject(ArticleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ──────────────────────────────────────────────
  // getAll()  — BaseDataService에서 상속
  // ──────────────────────────────────────────────
  describe('getAll()', () => {
    it('GET /articles 를 호출하고 IPage 형태로 결과를 반환해야 한다', () => {
      const req: IPageRequest<IArticle> = { pageIndex: 0, limit: 10, order: { orderBy: 'createdAt', orderType: 'desc' } };
      const query: IQuery = {};

      service.getAll(req, query).subscribe(page => {
        expect(page.data).toEqual([mockArticle]);
        expect(page.total).toBe(1);
        expect(page.pageIndex).toBe(0);
        expect(page.limit).toBe(10);
      });

      const httpReq = httpMock.expectOne(r => r.url === `${API_BASE}/articles`);
      expect(httpReq.request.method).toBe('GET');
      expect(httpReq.request.params.get('limit')).toBe('10');
      expect(httpReq.request.params.get('offset')).toBe('0');
      httpReq.flush({ success: true, listData: [mockArticle], total: 1 });
    });

    it('태그 쿼리 파라미터를 요청에 포함해야 한다', () => {
      const req: IPageRequest<IArticle> = { pageIndex: 0, limit: 5 };
      const query: IQuery = { tag: 'angular' } as any;

      service.getAll(req, query).subscribe();

      const httpReq = httpMock.expectOne(r => r.url === `${API_BASE}/articles`);
      expect(httpReq.request.params.get('tag')).toBe('angular');
      httpReq.flush({ success: true, listData: [], total: 0 });
    });
  });

  // ──────────────────────────────────────────────
  // getOne()  — BaseDataService에서 상속
  // ──────────────────────────────────────────────
  describe('getOne()', () => {
    it('GET /articles/:slug 를 호출하여 단일 게시글을 반환해야 한다', () => {
      service.getOne('test-article').subscribe(res => {
        expect(res.detailData).toEqual(mockArticle);
      });

      const req = httpMock.expectOne(`${API_BASE}/articles/test-article`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, detailData: mockArticle });
    });
  });

  // ──────────────────────────────────────────────
  // create()  — BaseDataService에서 상속
  // ──────────────────────────────────────────────
  describe('create()', () => {
    it('POST /articles 를 호출하여 새 게시글을 생성해야 한다', () => {
      const newArticle = {
        title: '새 게시글',
        description: '설명',
        body: '본문',
        tagList: ['test'],
      };
      const mockResponse: ActionSuccessResponse<IArticle> = {
        success: true,
        statusCode: 200,
        message: '생성 성공',
        data: { ...mockArticle, ...newArticle },
      } as any;

      service.create(newArticle).subscribe(res => {
        expect(res.data.title).toBe('새 게시글');
      });

      const req = httpMock.expectOne(`${API_BASE}/articles`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newArticle);
      req.flush(mockResponse);
    });
  });

  // ──────────────────────────────────────────────
  // update()  — BaseDataService에서 상속
  // ──────────────────────────────────────────────
  describe('update()', () => {
    it('PUT /articles/:slug 를 호출하여 게시글을 수정해야 한다', () => {
      const updateData = { title: '수정된 제목' };
      const mockResponse: ActionSuccessResponse<IArticle> = {
        success: true,
        statusCode: 200,
        message: '수정 성공',
        data: { ...mockArticle, title: '수정된 제목' },
      } as any;

      service.update('test-article', updateData).subscribe(res => {
        expect(res.data.title).toBe('수정된 제목');
      });

      const req = httpMock.expectOne(`${API_BASE}/articles/test-article`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockResponse);
    });
  });

  // ──────────────────────────────────────────────
  // delete()  — BaseDataService에서 상속
  // ──────────────────────────────────────────────
  describe('delete()', () => {
    it('DELETE /articles/:slug 를 호출하여 게시글을 삭제해야 한다', () => {
      const mockResponse: ActionSuccessResponse<IArticle> = {
        success: true,
        statusCode: 200,
        message: '삭제 성공',
        data: null,
      } as any;

      service.delete('test-article').subscribe(res => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${API_BASE}/articles/test-article`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  // ──────────────────────────────────────────────
  // getFeed()
  // ──────────────────────────────────────────────
  describe('getFeed()', () => {
    it('GET /articles/feed 를 호출하고 IPage 형태로 피드를 반환해야 한다', () => {
      const req: IPageRequest<IArticle> = { pageIndex: 0, limit: 10 };
      const query: IQuery = {};

      service.getFeed(req, query).subscribe(page => {
        expect(page.data).toEqual([mockArticle]);
        expect(page.total).toBe(1);
      });

      const httpReq = httpMock.expectOne(r => r.url === `${API_BASE}/articles/feed`);
      expect(httpReq.request.method).toBe('GET');
      httpReq.flush({ success: true, listData: [mockArticle], total: 1 });
    });

    it('loading=false이면 not-show 헤더가 설정되어야 한다', () => {
      service.getFeed({ pageIndex: 0, limit: 5 }, {}, false).subscribe();

      const httpReq = httpMock.expectOne(r => r.url === `${API_BASE}/articles/feed`);
      expect(httpReq.request.headers.get('loading')).toBe('not-show');
      httpReq.flush({ success: true, listData: [], total: 0 });
    });
  });

  // ──────────────────────────────────────────────
  // favoriteArticle()
  // ──────────────────────────────────────────────
  describe('favoriteArticle()', () => {
    it('POST /articles/:slug/favorite 를 호출하여 게시글을 좋아요해야 한다', () => {
      const favoritedArticle = { ...mockArticle, favorited: true, favoritesCount: 1 };
      const mockResponse: ActionSuccessResponse<IArticle> = {
        success: true,
        statusCode: 200,
        message: '좋아요 성공',
        data: favoritedArticle,
      } as any;

      service.favoriteArticle('test-article').subscribe(res => {
        expect(res.data.favorited).toBe(true);
        expect(res.data.favoritesCount).toBe(1);
      });

      const req = httpMock.expectOne(`${API_BASE}/articles/test-article/favorite`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      req.flush(mockResponse);
    });
  });

  // ──────────────────────────────────────────────
  // unfavoriteArticle()
  // ──────────────────────────────────────────────
  describe('unfavoriteArticle()', () => {
    it('DELETE /articles/:slug/favorite 를 호출하여 좋아요를 취소해야 한다', () => {
      const unfavoritedArticle = { ...mockArticle, favorited: false, favoritesCount: 0 };
      const mockResponse: ActionSuccessResponse<IArticle> = {
        success: true,
        statusCode: 200,
        message: '좋아요 취소 성공',
        data: unfavoritedArticle,
      } as any;

      service.unfavoriteArticle('test-article').subscribe(res => {
        expect(res.data.favorited).toBe(false);
        expect(res.data.favoritesCount).toBe(0);
      });

      const req = httpMock.expectOne(`${API_BASE}/articles/test-article/favorite`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('favoriteArticle과 unfavoriteArticle은 동일한 URL을 POST/DELETE로 구분하여 사용해야 한다', () => {
      service.favoriteArticle('my-slug').subscribe();
      const postReq = httpMock.expectOne(`${API_BASE}/articles/my-slug/favorite`);
      expect(postReq.request.method).toBe('POST');
      postReq.flush({ success: true, data: mockArticle });

      service.unfavoriteArticle('my-slug').subscribe();
      const deleteReq = httpMock.expectOne(`${API_BASE}/articles/my-slug/favorite`);
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush({ success: true, data: mockArticle });
    });
  });
});
