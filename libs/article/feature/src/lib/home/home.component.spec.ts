import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { of } from 'rxjs';

import { HomeComponent } from './home.component';
import { IUserService } from '@realworld/user/shared';
import { IArticleService, ITagService } from '@realworld/article/shared';

// ──────────────────────────────────────────────
// 목(Mock) 설정
// ──────────────────────────────────────────────

const mockArticlePage = {
  data: [
    {
      id: 'article-001',
      slug: 'test-article',
      title: '테스트 게시글',
      description: '설명',
      body: '본문',
      tagList: ['angular'],
      favorited: false,
      favoritesCount: 0,
    },
  ],
  total: 1,
  pageIndex: 0,
  limit: 10,
};

// ──────────────────────────────────────────────
// 헬퍼: TestBed 생성 함수 (isAuth를 파라미터로 받음)
// ──────────────────────────────────────────────
function createComponent(isAuth: boolean): {
  component: HomeComponent;
  fixture: ComponentFixture<HomeComponent>;
  articleService: jest.Mocked<Partial<IArticleService>>;
  tagService: jest.Mocked<Partial<ITagService>>;
} {
  const articleService = {
    getAll: jest.fn().mockReturnValue(of(mockArticlePage)),
    getFeed: jest.fn().mockReturnValue(of(mockArticlePage)),
    favoriteArticle: jest.fn().mockReturnValue(of({ success: true, data: {} })),
    unfavoriteArticle: jest.fn().mockReturnValue(of({ success: true, data: {} })),
  } as jest.Mocked<Partial<IArticleService>>;

  const tagService = {
    getAll: jest.fn().mockReturnValue(of({ data: ['angular', 'nestjs', 'typescript'] })),
  } as jest.Mocked<Partial<ITagService>>;

  const userService: Partial<IUserService> = { isAuth };

  const titleService: Partial<Title> = { setTitle: jest.fn() };

  TestBed.configureTestingModule({
    declarations: [HomeComponent],
    imports: [HttpClientTestingModule, RouterTestingModule],
    providers: [
      { provide: IUserService, useValue: userService },
      { provide: IArticleService, useValue: articleService },
      { provide: ITagService, useValue: tagService },
      { provide: Title, useValue: titleService },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  }).compileComponents();

  const fixture = TestBed.createComponent(HomeComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { component, fixture, articleService, tagService };
}

// ──────────────────────────────────────────────
// 테스트 스위트
// ──────────────────────────────────────────────

describe('HomeComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // ──────────────────────────────────────────────
  // 컴포넌트 생성
  // ──────────────────────────────────────────────

  it('컴포넌트가 정상적으로 생성되어야 한다', () => {
    const { component } = createComponent(false);
    expect(component).toBeTruthy();
  });

  // ──────────────────────────────────────────────
  // ngOnInit
  // ──────────────────────────────────────────────

  describe('ngOnInit()', () => {
    it('페이지 타이틀을 "Realworld - Home"으로 설정해야 한다', () => {
      const { fixture } = createComponent(false);
      const title = TestBed.inject(Title);
      expect(title.setTitle).toHaveBeenCalledWith('Realworld - Home');
    });

    it('비인증 상태에서 global 피드로 초기화되어야 한다', () => {
      const { component } = createComponent(false);
      expect(component.feedType).toBe('global');
    });

    it('인증 상태에서 personal 피드로 초기화되어야 한다', () => {
      const { component } = createComponent(true);
      expect(component.feedType).toBe('personal');
    });

    it('태그 목록 Observable이 설정되어야 한다', () => {
      const { component } = createComponent(false);
      expect(component.tags$).toBeDefined();
    });

    it('tagService.getAll을 호출하여 태그 목록을 가져와야 한다', () => {
      const { tagService } = createComponent(false);
      expect(tagService.getAll).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // toggleFeed() 메서드
  // ──────────────────────────────────────────────

  describe('toggleFeed()', () => {
    it('global 피드로 전환하면 feedType이 "global"이 되어야 한다', () => {
      const { component } = createComponent(false);
      component.toggleFeed('global');
      expect(component.feedType).toBe('global');
    });

    it('personal 피드로 전환하면 feedType이 "personal"이 되어야 한다', () => {
      const { component } = createComponent(false);
      component.toggleFeed('personal');
      expect(component.feedType).toBe('personal');
    });

    it('tag 피드로 전환하면 feedType이 "tag"이고 selectedTag가 설정되어야 한다', () => {
      const { component } = createComponent(false);
      component.toggleFeed('tag', 'angular');
      expect(component.feedType).toBe('tag');
      expect(component.selectedTag).toBe('angular');
    });

    it('각 피드 전환 후 dataSource가 생성되어야 한다', () => {
      const { component } = createComponent(false);

      component.toggleFeed('global');
      expect(component.dataSource).toBeDefined();

      component.toggleFeed('personal');
      expect(component.dataSource).toBeDefined();

      component.toggleFeed('tag', 'nestjs');
      expect(component.dataSource).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────
  // toggleFavorite() 메서드
  // ──────────────────────────────────────────────

  describe('toggleFavorite()', () => {
    it('비인증 상태에서 좋아요 시도 시 articleService가 호출되지 않아야 한다', async () => {
      const { component, articleService } = createComponent(false);
      await component.toggleFavorite({ favorite: true, slug: 'test-article' });
      expect(articleService.favoriteArticle).not.toHaveBeenCalled();
    });

    it('인증 상태에서 favorite=true이면 favoriteArticle을 호출해야 한다', async () => {
      const { component, articleService } = createComponent(true);
      component.toggleFeed('global');
      await component.toggleFavorite({ favorite: true, slug: 'test-article' });
      expect(articleService.favoriteArticle).toHaveBeenCalledWith('test-article');
    });

    it('인증 상태에서 favorite=false이면 unfavoriteArticle을 호출해야 한다', async () => {
      const { component, articleService } = createComponent(true);
      component.toggleFeed('global');
      await component.toggleFavorite({ favorite: false, slug: 'test-article' });
      expect(articleService.unfavoriteArticle).toHaveBeenCalledWith('test-article');
    });
  });
});
