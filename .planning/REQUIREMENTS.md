# Requirements: AI Image Editor

**Defined:** 2026-03-24
**Core Value:** 이미지 속 텍스트를 원본 스타일(폰트, 색상, 원근감)을 유지하면서 다른 텍스트로 자연스럽게 교체

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: Next.js 프로젝트 초기화 (App Router, Tailwind CSS, TypeScript)
- [ ] **FOUND-02**: Vercel Blob을 통한 이미지 업로드 (presigned URL 패턴, 최대 25MB)
- [x] **FOUND-03**: Drizzle ORM + Neon Postgres 데이터베이스 설정
- [x] **FOUND-04**: AI API 추상화 레이어 (AI SDK 6 + fal.ai/Replicate)

### Authentication

- [ ] **AUTH-01**: 이메일/비밀번호로 회원가입 및 로그인
- [ ] **AUTH-02**: OAuth 로그인 (Google)
- [ ] **AUTH-03**: 세션이 브라우저 새로고침 후에도 유지됨
- [ ] **AUTH-04**: 로그아웃 기능

### Editor Core

- [ ] **EDIT-01**: 이미지 드래그앤드롭/클릭으로 업로드 및 캔버스에 미리보기
- [ ] **EDIT-02**: 클립보드에서 이미지 붙여넣기
- [ ] **EDIT-03**: 크롭 도구 (자유 비율 + SNS 플랫폼 프리셋 비율)
- [ ] **EDIT-04**: 리사이즈 도구 (px 단위 크기 조절)
- [ ] **EDIT-05**: Undo/Redo (최소 20단계)
- [ ] **EDIT-06**: 편집 결과 다운로드 (PNG, JPG, WebP + 품질/해상도 선택)

### AI Text Replacement (Core Differentiator)

- [ ] **TEXT-01**: 이미지에서 텍스트 영역 자동 감지 (OCR)
- [ ] **TEXT-02**: 감지된 텍스트를 선택하여 새 텍스트로 교체
- [ ] **TEXT-03**: 교체 시 원본 폰트 스타일, 색상, 크기, 원근감 유지
- [ ] **TEXT-04**: 교체 결과 수동 미세 조정 컨트롤 (위치, 크기, 색상)
- [ ] **TEXT-05**: 다국어 텍스트 자동 번역 교체 (DeepL/Google Translate 연동)

### AI Background

- [ ] **BG-01**: 원클릭 배경 제거 (투명 배경)
- [ ] **BG-02**: 제거된 배경을 단색/그라데이션으로 교체
- [ ] **BG-03**: AI 생성 배경으로 교체 (프롬프트 입력)

### AI Object Removal

- [ ] **OBJ-01**: 브러시로 제거할 영역 선택
- [ ] **OBJ-02**: 선택 영역의 객체를 AI로 자연스럽게 제거 (inpainting)

### AI Upscaling

- [ ] **UPSC-01**: 2x 해상도 업스케일링
- [ ] **UPSC-02**: 4x 해상도 업스케일링

### AI Style Transfer

- [ ] **STYL-01**: 사진을 프리셋 스타일로 변환 (일러스트, 애니메이션, 수채화, 유화, 픽셀아트)
- [ ] **STYL-02**: 스타일 강도 조절 슬라이더

### Project Management

- [ ] **PROJ-01**: 편집 상태를 프로젝트로 저장
- [ ] **PROJ-02**: 대시보드에서 저장된 프로젝트 목록 (썸네일 미리보기)
- [ ] **PROJ-03**: 저장된 프로젝트 열어서 편집 재개
- [ ] **PROJ-04**: 프로젝트 삭제

### Billing & Credits

- [ ] **BILL-01**: 크레딧 기반 사용량 시스템 (AI 기능별 차등 소모)
- [ ] **BILL-02**: Stripe 구독 요금제 (Free / Pro / Enterprise)
- [ ] **BILL-03**: 크레딧 추가 충전 (one-time purchase)
- [ ] **BILL-04**: 사용량 대시보드 (남은 크레딧, 사용 내역)

### UI/UX

- [ ] **UI-01**: 반응형 웹 UI (데스크톱 우선, 태블릿/모바일 대응)
- [ ] **UI-02**: SNS 템플릿 프리셋 (IG Story, FB Post, YouTube Thumbnail, TikTok 등)
- [ ] **UI-03**: AI 처리 중 로딩/진행 상태 표시
- [ ] **UI-04**: 다크 모드 지원

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- **ADV-01**: 배치 텍스트 교체 (여러 이미지에 동일 텍스트 교체 일괄 적용)
- **ADV-02**: 편집 히스토리 타임라인 (비주얼 히스토리 브라우저)
- **ADV-03**: 커스텀 템플릿 저장 및 재사용
- **ADV-04**: 팀 워크스페이스 (공유 프로젝트)

### Notifications

- **NOTF-01**: 이메일 알림 (크레딧 소진 경고)
- **NOTF-02**: 인앱 알림 (AI 처리 완료)

## Out of Scope

| Feature | Reason |
|---------|--------|
| 실시간 협업 편집 | CRDT/OT 복잡도, v1은 개인 사용에 집중 |
| 모바일 네이티브 앱 | 웹 반응형으로 대응, 별도 앱 개발 비용 |
| 동영상 편집 | 완전히 다른 도메인, 이미지에 집중 |
| 자체 AI 모델 학습 | 외부 AI API 활용, ML 인프라 불필요 |
| AI 이미지 생성 (text-to-image) | 레드오션 시장, 편집에 집중 |
| 소셜 미디어 직접 게시 | 플랫폼별 OAuth/API 유지 비용, 다운로드로 대체 |
| 포토샵급 레이어 편집기 | 범위 과다, AI 빠른 편집 가치에 집중 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| UI-01 | Phase 1 | Pending |
| EDIT-01 | Phase 2 | Pending |
| EDIT-02 | Phase 2 | Pending |
| EDIT-03 | Phase 2 | Pending |
| EDIT-04 | Phase 2 | Pending |
| EDIT-05 | Phase 2 | Pending |
| EDIT-06 | Phase 2 | Pending |
| UI-02 | Phase 2 | Pending |
| PROJ-01 | Phase 3 | Pending |
| PROJ-02 | Phase 3 | Pending |
| PROJ-03 | Phase 3 | Pending |
| PROJ-04 | Phase 3 | Pending |
| BG-01 | Phase 4 | Pending |
| BG-02 | Phase 4 | Pending |
| BG-03 | Phase 4 | Pending |
| OBJ-01 | Phase 4 | Pending |
| OBJ-02 | Phase 4 | Pending |
| UI-03 | Phase 4 | Pending |
| TEXT-01 | Phase 5 | Pending |
| TEXT-02 | Phase 5 | Pending |
| TEXT-03 | Phase 5 | Pending |
| TEXT-04 | Phase 5 | Pending |
| TEXT-05 | Phase 5 | Pending |
| UPSC-01 | Phase 6 | Pending |
| UPSC-02 | Phase 6 | Pending |
| STYL-01 | Phase 6 | Pending |
| STYL-02 | Phase 6 | Pending |
| BILL-01 | Phase 7 | Pending |
| BILL-02 | Phase 7 | Pending |
| BILL-03 | Phase 7 | Pending |
| BILL-04 | Phase 7 | Pending |
| UI-04 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after roadmap creation*
