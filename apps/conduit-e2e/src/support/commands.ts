// ***********************************************
// 커스텀 Cypress 명령어 정의
//
// 커스텀 명령어에 대한 자세한 내용은 아래를 참고하세요:
// https://on.cypress.io/custom-commands
// ***********************************************

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Cypress {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Chainable<Subject> {
    /**
     * 사용자 로그인 커스텀 명령어
     * TODO: MySQL 데이터베이스가 준비된 후 실제 로그인 로직 구현 필요
     * @param email - 사용자 이메일
     * @param password - 사용자 비밀번호
     */
    login(email: string, password: string): void;
  }
}

// -- 부모 명령어 예시 --
// TODO: MySQL 데이터베이스 연결이 가능할 때 실제 로그인 구현 필요
Cypress.Commands.add('login', (email: string, password: string) => {
  // TODO: 현재 MySQL이 사용 불가하여 실제 로그인을 수행하지 않음
  // 구현 예시:
  // cy.request('POST', '/api/users/login', { user: { email, password } })
  //   .its('body.user.token')
  //   .then((token) => { window.localStorage.setItem('jwtToken', token); });
  cy.log(`로그인 플레이스홀더: ${email}`);
});

//
// -- 자식 명령어 예시 --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- 이중 명령어 예시 --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- 기존 명령어 오버라이드 예시 --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
