# AI Image Editor

## What This Is

AI 기반 이미지 편집 SaaS 서비스. SNS/마케팅 담당자가 이미지 속 텍스트를 다른 텍스트로 자연스럽게 변환하고, 배경 제거/교체, 객체 제거, 업스케일링, 스타일 변환 등 다양한 AI 편집 기능을 웹 브라우저에서 바로 사용할 수 있는 서비스. Stripe 구독 기반 크레딧 시스템과 다크 모드를 포함한 SaaS 출시 준비 완료.

## Core Value

이미지 속 텍스트를 원본 스타일(폰트, 색상, 원근감)을 유지하면서 다른 텍스트로 자연스럽게 교체할 수 있어야 한다.

## Requirements

### Validated

- ✓ 사용자 회원가입/로그인 (이메일+Google OAuth) — v1.0 Phase 1
- ✓ 이미지 업로드 및 미리보기 — v1.0 Phase 1
- ✓ 캔버스 기반 이미지 편집기 (Fabric.js) — v1.0 Phase 2
- ✓ 크롭/리사이즈/Undo-Redo/내보내기 — v1.0 Phase 2
- ✓ 편집 프로젝트 저장/로드/삭제 — v1.0 Phase 3
- ✓ AI 배경 제거/교체/객체 제거 — v1.0 Phase 4
- ✓ AI 텍스트 감지(OCR)/교체/번역 — v1.0 Phase 5
- ✓ AI 업스케일링 (2x/4x) — v1.0 Phase 6
- ✓ AI 스타일 변환 (5개 프리셋 + 강도 슬라이더) — v1.0 Phase 6
- ✓ Stripe 구독 결제 (Free/Pro/Enterprise) — v1.0 Phase 7
- ✓ 크레딧 시스템 (AI 기능별 차등 소모) — v1.0 Phase 7
- ✓ 사용량 대시보드 — v1.0 Phase 7
- ✓ 다크 모드 — v1.0 Phase 7

### Active

(v1.0 완료 — 다음 마일스톤에서 정의)

### Out of Scope

- 실시간 협업 편집 — v1에서는 개인 사용에 집중
- 모바일 네이티브 앱 — 웹 우선, 반응형으로 대응
- 동영상 편집 — 이미지 편집에 집중
- 자체 AI 모델 학습 — 외부 AI API 활용
- AI 이미지 생성 (text-to-image) — 레드오션 시장, 편집에 집중
- 소셜 미디어 직접 게시 — 다운로드로 대체

## Context

- v1.0 MVP 출시 완료 (2026-03-25)
- 100개 TypeScript/TSX 파일, 9,031 LOC
- Tech stack: Next.js 16, Fabric.js 6, AI SDK 6, fal.ai, Drizzle ORM, Neon Postgres, Better Auth, Stripe, Zustand, shadcn/ui, Tailwind CSS 4
- 7개 AI 기능: 배경 제거, 배경 교체, 객체 제거, OCR 텍스트 감지, 텍스트 교체/번역, 업스케일링, 스타일 변환
- SNS/마케팅 용도: 배너, 썸네일, 광고 이미지의 텍스트를 다국어로 바꾸거나 문구 수정

## Constraints

- **Tech Stack**: Next.js 풀스택 (App Router) — 프론트엔드 + 백엔드 통합
- **배포**: Vercel — AI Gateway로 AI 모델 통합
- **AI Models**: 외부 AI API 활용 (자체 모델 학습 없음)
- **Target**: 웹 브라우저 (데스크톱 우선, 반응형)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js 풀스택 | 프론트+백엔드 통합, Vercel 최적화 배포 | ✓ Good |
| 이미지 내 텍스트 변환을 핵심 기능으로 | 경쟁 서비스 대비 차별점 | ✓ Good |
| SaaS 모델 | 불특정 다수 대상 공개 서비스 | ✓ Good |
| Fabric.js 6 for canvas | 내장 텍스트 편집, 객체 모델, 직렬화 | ✓ Good |
| fal.ai as primary AI provider | 빠른 추론, 합리적 가격, AI SDK 호환 | ✓ Good |
| Better Auth over NextAuth | 무료, 자체호스팅, 2FA/passkey 지원 | ✓ Good |
| Drizzle ORM over Prisma | Edge 호환, 빠른 쿼리, 코드 생성 불필요 | ✓ Good |
| Google Cloud Vision for OCR | REST API 직접 호출 (SDK 118+ deps 회피) | ✓ Good |
| Stripe Checkout redirect mode | PCI 자동 처리, 간단한 통합 | ✓ Good |
| next-themes for dark mode | shadcn/ui 기본 지원, 최소 커스텀 작업 | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-25 after v1.0 milestone*
