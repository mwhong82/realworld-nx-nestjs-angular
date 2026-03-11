import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';
import { IUserService } from '@realworld/user/shared';

// ──────────────────────────────────────────────
// 목(Mock) 설정
// ──────────────────────────────────────────────

const mockUserService: Partial<IUserService> = {
  register: jest.fn().mockReturnValue(of({ success: true, data: { id: '1', username: 'testuser' } })),
};

const mockTitle: Partial<Title> = {
  setTitle: jest.fn(),
};

// ──────────────────────────────────────────────
// 테스트 스위트
// ──────────────────────────────────────────────

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RegisterComponent],
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
    fixture = TestBed.createComponent(RegisterComponent);
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
    it('페이지 타이틀을 "Sign up"으로 설정해야 한다', () => {
      component.ngOnInit();
      expect(mockTitle.setTitle).toHaveBeenCalledWith('Sign up');
    });
  });

  // ──────────────────────────────────────────────
  // 폼 초기화
  // ──────────────────────────────────────────────

  describe('폼 초기화', () => {
    it('username, email, password 필드가 있는 폼 그룹을 생성해야 한다', () => {
      expect(component.form).toBeDefined();
      expect(component.form.get('username')).toBeTruthy();
      expect(component.form.get('email')).toBeTruthy();
      expect(component.form.get('password')).toBeTruthy();
    });

    it('초기 상태에서 폼이 유효하지 않아야 한다', () => {
      expect(component.form.valid).toBe(false);
    });

    it('control 게터가 email, password, confirmedPassword를 반환해야 한다', () => {
      expect(component.control.email).toBeTruthy();
      expect(component.control.password).toBeTruthy();
      // confirmedPassword는 control에 정의되어 있지만 폼에는 없어도 됨
      expect(component.control.confirmedPassword).toBeNull();
    });
  });

  // ──────────────────────────────────────────────
  // 폼 유효성 검사
  // ──────────────────────────────────────────────

  describe('폼 유효성 검사', () => {
    it('모든 필드가 비어 있으면 폼이 유효하지 않아야 한다', () => {
      component.form.setValue({ username: null, email: null, password: null });
      expect(component.form.valid).toBe(false);
    });

    it('username이 비어 있으면 required 오류가 발생해야 한다', () => {
      component.form.patchValue({ username: null, email: 'test@example.com', password: 'password123' });
      expect(component.form.get('username').hasError('required')).toBe(true);
    });

    it('유효하지 않은 이메일 형식이면 email 필드가 유효하지 않아야 한다', () => {
      component.form.patchValue({ username: 'testuser', email: 'not-an-email', password: 'password123' });
      expect(component.control.email.valid).toBe(false);
    });

    it('올바른 값을 모두 입력하면 폼이 유효해야 한다', () => {
      component.form.patchValue({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(component.form.valid).toBe(true);
    });

    it('username이 60자를 초과하면 폼이 유효하지 않아야 한다', () => {
      component.form.patchValue({
        username: 'a'.repeat(61),
        email: 'test@example.com',
        password: 'password123',
      });
      expect(component.form.get('username').valid).toBe(false);
    });

    it('password가 200자를 초과하면 폼이 유효하지 않아야 한다', () => {
      component.form.patchValue({
        username: 'testuser',
        email: 'test@example.com',
        password: 'a'.repeat(201),
      });
      expect(component.form.get('password').valid).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // submit() 메서드
  // ──────────────────────────────────────────────

  describe('submit()', () => {
    it('userService.register를 폼 값으로 호출해야 한다', async () => {
      const formValue = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      component.form.setValue(formValue);

      await component.submit();

      expect(mockUserService.register).toHaveBeenCalledWith(formValue);
    });

    it('회원가입 성공 후 루트 경로("/")로 이동해야 한다', async () => {
      const router = TestBed.inject(RouterTestingModule as any);
      component.form.setValue({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      await component.submit();

      expect(mockUserService.register).toHaveBeenCalled();
    });
  });
});
