import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { ProfileService } from './profile.service';
import { IConfigurationService } from '@realworld/shared/configuration';
import { IProfile } from '@realworld/user/api-interfaces';
import { ActionSuccessResponse, DetailSuccessResponse } from '@realworld/shared/client-server';

// ──────────────────────────────────────────────
// 테스트 픽스처
// ──────────────────────────────────────────────
const API_BASE = 'http://localhost:3000/api';

const mockProfile: IProfile = {
  id: 'user-uuid-002',
  username: 'janedoe',
  bio: '프로필 바이오',
  image: 'https://example.com/jane.png',
  following: false,
} as IProfile;

const mockConfigService: Partial<IConfigurationService> = {
  configs$: of({ rest: { url: API_BASE } } as any),
};

// ──────────────────────────────────────────────
// 테스트 스위트
// ──────────────────────────────────────────────
describe('ProfileService (프론트엔드)', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ProfileService,
        { provide: IConfigurationService, useValue: mockConfigService },
      ],
    });

    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ──────────────────────────────────────────────
  // getProfile()
  // ──────────────────────────────────────────────
  describe('getProfile()', () => {
    it('GET /profiles/:username 을 호출하여 프로필을 반환해야 한다', () => {
      const mockResponse: DetailSuccessResponse<IProfile> = {
        success: true,
        statusCode: 200,
        detailData: mockProfile,
      } as any;

      service.getProfile('janedoe').subscribe(res => {
        expect(res.detailData).toEqual(mockProfile);
        expect(res.detailData.username).toBe('janedoe');
      });

      const req = httpMock.expectOne(`${API_BASE}/profiles/janedoe`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('loading=false이면 not-show 헤더가 설정되어야 한다', () => {
      service.getProfile('janedoe', false).subscribe();

      const req = httpMock.expectOne(`${API_BASE}/profiles/janedoe`);
      expect(req.request.headers.get('loading')).toBe('not-show');
      req.flush({ success: true, detailData: mockProfile });
    });

    it('다른 사용자명으로 올바른 URL을 구성해야 한다', () => {
      service.getProfile('johndoe').subscribe();

      const req = httpMock.expectOne(`${API_BASE}/profiles/johndoe`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, detailData: { ...mockProfile, username: 'johndoe' } });
    });
  });

  // ──────────────────────────────────────────────
  // followAUser()
  // ──────────────────────────────────────────────
  describe('followAUser()', () => {
    it('POST /profiles/:username/follow 를 호출하여 팔로우해야 한다', () => {
      const followedProfile = { ...mockProfile, following: true };
      const mockResponse: ActionSuccessResponse<IProfile> = {
        success: true,
        statusCode: 200,
        message: '팔로우 성공',
        data: followedProfile,
      } as any;

      service.followAUser('janedoe').subscribe(res => {
        expect(res.data).toEqual(followedProfile);
        expect(res.data.following).toBe(true);
      });

      const req = httpMock.expectOne(`${API_BASE}/profiles/janedoe/follow`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      req.flush(mockResponse);
    });

    it('요청 헤더에 Content-Type이 application/json으로 설정되어야 한다', () => {
      service.followAUser('janedoe').subscribe();

      const req = httpMock.expectOne(`${API_BASE}/profiles/janedoe/follow`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush({ success: true, data: mockProfile });
    });
  });

  // ──────────────────────────────────────────────
  // unfollowAUser()
  // ──────────────────────────────────────────────
  describe('unfollowAUser()', () => {
    it('DELETE /profiles/:username/follow 를 호출하여 언팔로우해야 한다', () => {
      const unfollowedProfile = { ...mockProfile, following: false };
      const mockResponse: ActionSuccessResponse<IProfile> = {
        success: true,
        statusCode: 200,
        message: '언팔로우 성공',
        data: unfollowedProfile,
      } as any;

      service.unfollowAUser('janedoe').subscribe(res => {
        expect(res.data).toEqual(unfollowedProfile);
        expect(res.data.following).toBe(false);
      });

      const req = httpMock.expectOne(`${API_BASE}/profiles/janedoe/follow`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('loading=false이면 not-show 헤더가 설정되어야 한다', () => {
      service.unfollowAUser('janedoe', false).subscribe();

      const req = httpMock.expectOne(`${API_BASE}/profiles/janedoe/follow`);
      expect(req.request.headers.get('loading')).toBe('not-show');
      req.flush({ success: true, data: mockProfile });
    });

    it('팔로우와 언팔로우가 동일한 URL /profiles/:username/follow 을 사용해야 한다', () => {
      // follow 후 unfollow — 같은 엔드포인트, 다른 메서드
      service.followAUser('janedoe').subscribe();
      const followReq = httpMock.expectOne(`${API_BASE}/profiles/janedoe/follow`);
      expect(followReq.request.method).toBe('POST');
      followReq.flush({ success: true, data: { ...mockProfile, following: true } });

      service.unfollowAUser('janedoe').subscribe();
      const unfollowReq = httpMock.expectOne(`${API_BASE}/profiles/janedoe/follow`);
      expect(unfollowReq.request.method).toBe('DELETE');
      unfollowReq.flush({ success: true, data: { ...mockProfile, following: false } });
    });
  });
});
