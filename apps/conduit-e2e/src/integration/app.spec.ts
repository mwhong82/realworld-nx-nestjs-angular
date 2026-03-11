describe('conduit 스모크 테스트', () => {
  it('홈페이지가 정상적으로 로드되어야 한다', () => {
    cy.visit('/');
    cy.get('body').should('exist');
  });
});
