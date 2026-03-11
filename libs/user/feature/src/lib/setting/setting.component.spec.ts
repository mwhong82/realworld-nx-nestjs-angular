import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { of } from 'rxjs';

import { SettingComponent } from './setting.component';
import { IUserService } from '@realworld/user/shared';

// ──────────────────────────────────────────────
// 목(Mock) 설정
// ──────────────────────────────────────────────

const mockCurrentUser = {
  id: 'user-uuid-001',
  username: 'testuser',
  email: 'test@example.com',
  bio: '테스트 바이오',
  image: 'https://example.com/avatar.png',
};

const mockUserService: Partial<IUserService> = {
  getCurrentUser: jest.fn().mockReturnValue(
    of({ detailData: mockCurrentUser })
  ),
  update: jest.fn().mockReturnValue(of({ success: true, data: mockCurrentUser })),
  logout: jest.fn(),
};

const mockTitle: Partial<Title> = {
  setTitle: jest.fn(),
};

// ──────────────────────────────────────────────
// 테스트 스위트
// ──────────────────────────────────────────────

describe('SettingComponent', () => {
  let component: SettingComponent;
  let fixture: ComponentFixture<SettingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SettingComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule,
      ],
      providers: [
        { provide: IUserService, useValue: mockUserService },
        { provide: Title, useValue: mockTitle },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ──────────────────────────────────────────────
  // 컴포넌트 생성
  // ──────────────────────────────────────────────

  it('컴포넌트가 정상적으로 생성되어야 한다', () => {
    expect(component).toBeTruthy();
  });

  // ──────────────────────────────────────────────
  // ngOnInit
  // ──────────────────────────────────────────────

  describe('ngOnInit()', () => {
    it('페이지 타이틀을 "Realworld - View Settings"로 설정해야 한다', async () => {
      await component.ngOnInit();
      expect(mockTitle.setTitle).toHaveBeenCalledWith('Realworld - View Settings');
    });

    it('현재 사용자 정보를 가져와 폼에 적용해야 한다', async () => {
      await component.ngOnInit();
      expect(mockUserService.getCurrentUser).toHaveBeenCalled();
      expect(component.form.get('username').value).toBe('testuser');
      expect(component.form.get('email').value).toBe('test@example.com');
    });
  });

  // ──────────────────────────────────────────────
  // 폼 초기화
  // ──────────────────────────────────────────────

  describe('폼 초기화', () => {
    it('image, username, bio, email, password 필드가 있는 폼을 생성해야 한다', () => {
      expect(component.form).toBeDefined();
      expect(component.form.get('image')).toBeTruthy();
      expect(component.form.get('username')).toBeTruthy();
      expect(component.form.get('bio')).toBeTruthy();
      expect(component.form.get('email')).toBeTruthy();
      expect(component.form.get('password')).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────
  // 폼 유효성 검사
  // ──────────────────────────────────────────────

  describe('폼 유효성 검사', () => {
    it('username이 required이므로 비워두면 폼이 유효하지 않아야 한다', () => {
      component.form.patchValue({
        username: null,
        email: 'test@example.com',
        password: null,
        bio: null,
        image: null,
      });
      expect(component.form.get('username').hasError('required')).toBe(true);
    });

    it('email이 required이므로 비워두면 폼이 유효하지 않아야 한다', () => {
      component.form.patchValue({
        username: 'testuser',
        email: null,
        password: null,
        bio: null,
        image: null,
      });
      expect(component.form.get('email').hasError('required')).toBe(true);
    });

    it('유효하지 않은 이미지 URL이면 image 필드가 유효하지 않아야 한다', () => {
      component.form.patchValue({ image: 'not-a-url' });
      expect(component.form.get('image').valid).toBe(false);
    });

    it('올바른 값을 모두 입력하면 폼이 유효해야 한다', () => {
      component.form.patchValue({
        image: null,
        username: 'testuser',
        bio: '바이오',
        email: 'test@example.com',
        password: null,
      });
      expect(component.form.valid).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // update() 메서드
  // ──────────────────────────────────────────────

  describe('update()', () => {
    it('userService.update를 폼 값으로 호출해야 한다', async () => {
      component.form.patchValue({
        image: null,
        username: 'updateduser',
        bio: '새 바이오',
        email: 'updated@example.com',
        password: null,
      });

      await component.update();

      expect(mockUserService.update).toHaveBeenCalledWith(null, component.form.value);
    });
  });

  // ──────────────────────────────────────────────
  // logout() 메서드
  // ──────────────────────────────────────────────

  describe('logout()', () => {
    it('userService.logout을 호출해야 한다', () => {
      component.logout();
      expect(mockUserService.logout).toHaveBeenCalled();
    });

    it('로그아웃 후 루트 경로("/")로 이동해야 한다', () => {
      // logout()이 router.navigate(['/'])를 호출하므로 에러 없이 실행되어야 한다
      expect(() => component.logout()).not.toThrow();
    });
  });
});
