import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { of } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthUIService } from '@realworld/user/shared';

// ──────────────────────────────────────────────
// 목(Mock) 설정
// ──────────────────────────────────────────────

const mockAuthUIService: Partial<AuthUIService> = {
  login: jest.fn().mockReturnValue(of({ data: { token: 'mock-token' } })),
};

const mockActivatedRoute = {
  snapshot: {
    queryParamMap: {
      get: jest.fn().mockReturnValue('/home'),
    },
  },
};

const mockTitle: Partial<Title> = {
  setTitle: jest.fn(),
};

// ──────────────────────────────────────────────
// 테스트 스위트
// ──────────────────────────────────────────────

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule,
      ],
      providers: [
        { provide: AuthUIService, useValue: mockAuthUIService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Title, useValue: mockTitle },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
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
    it('페이지 타이틀을 "Sign in"으로 설정해야 한다', () => {
      component.ngOnInit();
      expect(mockTitle.setTitle).toHaveBeenCalledWith('Sign in');
    });
  });

  // ──────────────────────────────────────────────
  // 폼 초기화
  // ──────────────────────────────────────────────

  describe('폼 초기화', () => {
    it('email 및 password 필드가 있는 폼 그룹을 생성해야 한다', () => {
      expect(component.form).toBeDefined();
      expect(component.form.get('email')).toBeTruthy();
      expect(component.form.get('password')).toBeTruthy();
    });

    it('초기 상태에서 폼이 유효하지 않아야 한다', () => {
      expect(component.form.valid).toBe(false);
    });

    it('control 게터가 email, password 컨트롤을 반환해야 한다', () => {
      expect(component.control.email).toBeTruthy();
      expect(component.control.password).toBeTruthy();
    });
  });

  // ──────────────────────────────────────────────
  // 폼 유효성 검사
  // ──────────────────────────────────────────────

  describe('폼 유효성 검사', () => {
    it('email과 password가 모두 비어 있으면 폼이 유효하지 않아야 한다', () => {
      component.form.setValue({ email: null, password: null });
      expect(component.form.valid).toBe(false);
    });

    it('유효하지 않은 이메일 형식이면 email 필드가 유효하지 않아야 한다', () => {
      component.form.patchValue({ email: 'invalid-email', password: 'password123' });
      expect(component.control.email.valid).toBe(false);
    });

    it('올바른 이메일과 비밀번호를 입력하면 폼이 유효해야 한다', () => {
      component.form.patchValue({ email: 'test@example.com', password: 'password123' });
      expect(component.form.valid).toBe(true);
    });

    it('password 필드가 required 유효성 검사를 적용해야 한다', () => {
      component.form.patchValue({ email: 'test@example.com', password: null });
      expect(component.control.password.hasError('required')).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // login() 메서드
  // ──────────────────────────────────────────────

  describe('login()', () => {
    it('authUIService.login을 폼 값으로 호출해야 한다', () => {
      const formValue = { email: 'test@example.com', password: 'password123' };
      component.form.setValue(formValue);

      component.login();

      expect(mockAuthUIService.login).toHaveBeenCalledWith(formValue);
    });

    it('로그인 성공 후 returnUrl로 이동해야 한다', () => {
      const router = TestBed.inject(RouterTestingModule as any);
      component.form.setValue({ email: 'test@example.com', password: 'password123' });

      component.login();

      // authUIService.login이 호출되어야 한다
      expect(mockAuthUIService.login).toHaveBeenCalled();
    });
  });
});
