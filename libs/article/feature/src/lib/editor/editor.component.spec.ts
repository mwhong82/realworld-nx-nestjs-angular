import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { of } from 'rxjs';

import { EditorComponent } from './editor.component';
import { IUserService } from '@realworld/user/shared';
import { IArticleService } from '@realworld/article/shared';

// ──────────────────────────────────────────────
// 픽스처 데이터
// ──────────────────────────────────────────────

const mockArticle = {
  id: 'article-001',
  slug: 'test-article',
  title: '테스트 게시글',
  description: '테스트 설명',
  body: '테스트 본문',
  tagList: ['angular', 'nestjs'],
};

// ──────────────────────────────────────────────
// 헬퍼: TestBed 생성 함수
// ──────────────────────────────────────────────

function createComponent(slug: string | null = null): {
  component: EditorComponent;
  fixture: ComponentFixture<EditorComponent>;
  articleService: jest.Mocked<Partial<IArticleService>>;
  titleService: jest.Mocked<Partial<Title>>;
} {
  // mockImplementation으로 매 호출마다 새 객체를 생성 — processArticleResponse가 tagList를 in-place 변환하므로 필수
  const articleService: jest.Mocked<Partial<IArticleService>> = {
    getOne: jest.fn().mockImplementation(() =>
      of({ detailData: { ...mockArticle, tagList: ['angular', 'nestjs'] } })
    ),
    create: jest.fn().mockImplementation(() =>
      of({ success: true, data: { ...mockArticle } })
    ),
    update: jest.fn().mockImplementation(() =>
      of({ success: true, data: { ...mockArticle } })
    ),
  };

  const userService: Partial<IUserService> = { isAuth: true };
  const titleService: jest.Mocked<Partial<Title>> = { setTitle: jest.fn() };

  const activatedRoute = {
    snapshot: {
      params: slug ? { slug } : {},
    },
  };

  TestBed.configureTestingModule({
    declarations: [EditorComponent],
    imports: [
      HttpClientTestingModule,
      RouterTestingModule,
      ReactiveFormsModule,
    ],
    providers: [
      { provide: IUserService, useValue: userService },
      { provide: IArticleService, useValue: articleService },
      { provide: ActivatedRoute, useValue: activatedRoute },
      { provide: Title, useValue: titleService },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  }).compileComponents();

  // detectChanges 없이 인스턴스만 생성 (ngOnInit은 테스트에서 직접 제어)
  const fixture = TestBed.createComponent(EditorComponent);
  const component = fixture.componentInstance;

  return { component, fixture, articleService, titleService };
}

// ──────────────────────────────────────────────
// 테스트 스위트
// ──────────────────────────────────────────────

describe('EditorComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // ──────────────────────────────────────────────
  // 컴포넌트 생성
  // ──────────────────────────────────────────────

  it('컴포넌트가 정상적으로 생성되어야 한다', () => {
    const { component } = createComponent();
    expect(component).toBeTruthy();
  });

  // ──────────────────────────────────────────────
  // 폼 초기화
  // ──────────────────────────────────────────────

  describe('폼 초기화', () => {
    it('slug, title, description, body, tagList 필드가 있는 폼을 생성해야 한다', () => {
      const { component } = createComponent();
      expect(component.form.get('slug')).toBeTruthy();
      expect(component.form.get('title')).toBeTruthy();
      expect(component.form.get('description')).toBeTruthy();
      expect(component.form.get('body')).toBeTruthy();
      expect(component.form.get('tagList')).toBeTruthy();
    });

    it('초기 상태에서 폼이 유효하지 않아야 한다 (title, description, body가 required)', () => {
      const { component } = createComponent();
      expect(component.form.valid).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // ngOnInit — 새 글 작성 (slug 없음)
  // ──────────────────────────────────────────────

  describe('ngOnInit() — 새 글 작성', () => {
    it('페이지 타이틀을 "Realworld - New article"로 설정해야 한다', async () => {
      const { component, titleService } = createComponent(null);
      await component.ngOnInit();
      expect(titleService.setTitle).toHaveBeenCalledWith('Realworld - New article');
    });

    it('slug가 없으면 articleService.getOne을 호출하지 않아야 한다', async () => {
      const { component, articleService } = createComponent(null);
      await component.ngOnInit();
      expect(articleService.getOne).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // ngOnInit — 기존 글 수정 (slug 있음)
  // ──────────────────────────────────────────────

  describe('ngOnInit() — 기존 글 수정', () => {
    it('slug가 있으면 articleService.getOne을 호출해야 한다', async () => {
      const { component, articleService } = createComponent('test-article');
      await component.ngOnInit();
      expect(articleService.getOne).toHaveBeenCalledWith('test-article');
    });

    it('slug가 있으면 tagList 필드를 비활성화해야 한다', async () => {
      const { component } = createComponent('test-article');
      await component.ngOnInit();
      expect(component.form.get('tagList').disabled).toBe(true);
    });

    it('불러온 게시글 데이터로 폼을 채워야 한다', async () => {
      const { component } = createComponent('test-article');
      await component.ngOnInit();
      expect(component.form.get('title').value).toBe('테스트 게시글');
      expect(component.form.get('description').value).toBe('테스트 설명');
    });
  });

  // ──────────────────────────────────────────────
  // 폼 유효성 검사
  // ──────────────────────────────────────────────

  describe('폼 유효성 검사', () => {
    it('title이 비어 있으면 required 오류가 발생해야 한다', () => {
      const { component } = createComponent();
      component.form.patchValue({ title: null, description: '설명', body: '본문' });
      expect(component.form.get('title').hasError('required')).toBe(true);
    });

    it('description이 비어 있으면 required 오류가 발생해야 한다', () => {
      const { component } = createComponent();
      component.form.patchValue({ title: '제목', description: null, body: '본문' });
      expect(component.form.get('description').hasError('required')).toBe(true);
    });

    it('body가 비어 있으면 required 오류가 발생해야 한다', () => {
      const { component } = createComponent();
      component.form.patchValue({ title: '제목', description: '설명', body: null });
      expect(component.form.get('body').hasError('required')).toBe(true);
    });

    it('모든 필수 필드를 입력하면 폼이 유효해야 한다', () => {
      const { component } = createComponent();
      component.form.patchValue({
        slug: null,
        title: '제목',
        description: '설명',
        body: '본문',
        tagList: null,
      });
      expect(component.form.valid).toBe(true);
    });

    it('title이 200자를 초과하면 폼이 유효하지 않아야 한다', () => {
      const { component } = createComponent();
      component.form.patchValue({ title: 'a'.repeat(201) });
      expect(component.form.get('title').valid).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // submit() — 새 글 생성
  // ──────────────────────────────────────────────

  describe('submit() — 새 글 생성', () => {
    it('slug가 없으면 articleService.create를 호출해야 한다', async () => {
      const { component, articleService } = createComponent(null);
      component.form.patchValue({
        slug: null,
        title: '새 게시글',
        description: '설명',
        body: '본문',
        tagList: 'angular, nestjs',
      });

      await component.submit();

      expect(articleService.create).toHaveBeenCalled();
      expect(articleService.update).not.toHaveBeenCalled();
    });

    it('tagList 문자열이 배열로 변환되어 전달되어야 한다', async () => {
      const { component, articleService } = createComponent(null);
      component.form.patchValue({
        slug: null,
        title: '새 게시글',
        description: '설명',
        body: '본문',
        tagList: 'angular, nestjs',
      });

      await component.submit();

      const callArg = (articleService.create as jest.Mock).mock.calls[0][0];
      expect(Array.isArray(callArg.tagList)).toBe(true);
      expect(callArg.tagList).toEqual(['angular', 'nestjs']);
    });
  });

  // ──────────────────────────────────────────────
  // submit() — 기존 글 수정
  // ──────────────────────────────────────────────

  describe('submit() — 기존 글 수정', () => {
    it('slug가 있으면 articleService.update를 호출해야 한다', async () => {
      const { component, articleService } = createComponent(null);
      component.form.patchValue({
        slug: 'test-article',
        title: '수정된 게시글',
        description: '설명',
        body: '본문',
        tagList: null,
      });

      await component.submit();

      expect(articleService.update).toHaveBeenCalledWith('test-article', expect.any(Object));
      expect(articleService.create).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // loadArticle()
  // ──────────────────────────────────────────────

  describe('loadArticle()', () => {
    it('slug로 게시글을 불러와 폼에 적용해야 한다', async () => {
      const { component, articleService } = createComponent(null);
      await component.loadArticle('test-article');

      expect(articleService.getOne).toHaveBeenCalledWith('test-article');
      expect(component.form.get('title').value).toBe('테스트 게시글');
    });

    it('게시글 응답이 null이면 에러 없이 처리되어야 한다', async () => {
      const { component, articleService } = createComponent(null);
      (articleService.getOne as jest.Mock).mockReturnValue(of(null));

      await expect(component.loadArticle('no-article')).resolves.not.toThrow();
    });
  });
});
