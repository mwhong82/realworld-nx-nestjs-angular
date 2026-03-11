import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { CommentService } from './comment.service';
import { IConfigurationService } from '@realworld/shared/configuration';
import { IComment, INewComment } from '@realworld/article/api-interfaces';
import { ActionSuccessResponse } from '@realworld/shared/client-server';

// ──────────────────────────────────────────────
// 테스트 픽스처
// ──────────────────────────────────────────────
const API_BASE = 'http://localhost:3000/api';

const mockComment: IComment = {
  id: 'comment-uuid-001',
  body: '테스트 댓글 내용',
  author: {
    id: 'user-uuid-001',
    username: 'testuser',
    bio: '',
    image: '',
    following: false,
  } as any,
} as IComment;

const mockConfigService: Partial<IConfigurationService> = {
  configs$: of({ rest: { url: API_BASE } } as any),
};

// ──────────────────────────────────────────────
// 테스트 스위트
// ──────────────────────────────────────────────
describe('CommentService (프론트엔드)', () => {
  let service: CommentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CommentService,
        { provide: IConfigurationService, useValue: mockConfigService },
      ],
    });

    service = TestBed.inject(CommentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ──────────────────────────────────────────────
  // getAllComments()
  // ──────────────────────────────────────────────
  describe('getAllComments()', () => {
    it('GET /articles/:slug/comments 를 호출하고 IPage 형태로 댓글 목록을 반환해야 한다', () => {
      service.getAllComments('test-article').subscribe(page => {
        expect(page.data).toEqual([mockComment]);
        expect(page.total).toBe(1);
      });

      const req = httpMock.expectOne(r => r.url === `${API_BASE}/articles/test-article/comments`);
      expect(req.request.method).toBe('GET');
      // orderBy=createdAt&orderType=desc 파라미터가 포함되어야 한다
      expect(req.request.params.get('orderBy')).toBe('createdAt');
      expect(req.request.params.get('orderType')).toBe('desc');
      req.flush({ success: true, listData: [mockComment], total: 1 });
    });

    it('다른 슬러그로 올바른 URL을 구성해야 한다', () => {
      service.getAllComments('another-article').subscribe();

      const req = httpMock.expectOne(r => r.url === `${API_BASE}/articles/another-article/comments`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, listData: [], total: 0 });
    });

    it('loading=false이면 not-show 헤더가 설정되어야 한다', () => {
      service.getAllComments('test-article', false).subscribe();

      const req = httpMock.expectOne(r => r.url === `${API_BASE}/articles/test-article/comments`);
      expect(req.request.headers.get('loading')).toBe('not-show');
      req.flush({ success: true, listData: [], total: 0 });
    });

    it('댓글이 없으면 빈 data 배열과 total 0을 반환해야 한다', () => {
      service.getAllComments('empty-article').subscribe(page => {
        expect(page.data).toEqual([]);
        expect(page.total).toBe(0);
      });

      const req = httpMock.expectOne(r => r.url === `${API_BASE}/articles/empty-article/comments`);
      req.flush({ success: true, listData: [], total: 0 });
    });
  });

  // ──────────────────────────────────────────────
  // postComment()
  // ──────────────────────────────────────────────
  describe('postComment()', () => {
    const newComment: INewComment = {
      body: '새 댓글 내용',
    } as INewComment;

    it('POST /articles/:slug/comments 를 호출하여 댓글을 작성해야 한다', () => {
      const mockResponse: ActionSuccessResponse<IComment> = {
        success: true,
        statusCode: 200,
        message: '댓글 작성 성공',
        data: { ...mockComment, body: '새 댓글 내용' },
      } as any;

      service.postComment('test-article', newComment).subscribe(res => {
        expect(res.data.body).toBe('새 댓글 내용');
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${API_BASE}/articles/test-article/comments`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newComment);
      req.flush(mockResponse);
    });

    it('요청 헤더에 Content-Type이 application/json으로 설정되어야 한다', () => {
      service.postComment('test-article', newComment).subscribe();

      const req = httpMock.expectOne(`${API_BASE}/articles/test-article/comments`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush({ success: true, data: mockComment });
    });

    it('loading=false이면 not-show 헤더가 설정되어야 한다', () => {
      service.postComment('test-article', newComment, false).subscribe();

      const req = httpMock.expectOne(`${API_BASE}/articles/test-article/comments`);
      expect(req.request.headers.get('loading')).toBe('not-show');
      req.flush({ success: true, data: mockComment });
    });
  });

  // ──────────────────────────────────────────────
  // deleteComments()
  // ──────────────────────────────────────────────
  describe('deleteComments()', () => {
    it('DELETE /articles/:slug/comments/:id 를 호출하여 댓글을 삭제해야 한다', () => {
      const mockResponse: ActionSuccessResponse<null> = {
        success: true,
        statusCode: 200,
        message: '댓글 삭제 성공',
        data: null,
      } as any;

      service.deleteComments('test-article', 'comment-uuid-001').subscribe(res => {
        expect(res.success).toBe(true);
        expect(res.data).toBeNull();
      });

      const req = httpMock.expectOne(
        `${API_BASE}/articles/test-article/comments/comment-uuid-001`
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('다른 댓글 ID로 올바른 URL을 구성해야 한다', () => {
      service.deleteComments('my-article', 'comment-uuid-999').subscribe();

      const req = httpMock.expectOne(
        `${API_BASE}/articles/my-article/comments/comment-uuid-999`
      );
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, data: null });
    });

    it('loading=false이면 not-show 헤더가 설정되어야 한다', () => {
      service.deleteComments('test-article', 'comment-uuid-001', false).subscribe();

      const req = httpMock.expectOne(
        `${API_BASE}/articles/test-article/comments/comment-uuid-001`
      );
      expect(req.request.headers.get('loading')).toBe('not-show');
      req.flush({ success: true, data: null });
    });
  });
});
