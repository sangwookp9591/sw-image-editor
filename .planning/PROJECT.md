# AI Image Editor

## What This Is

AI 기반 이미지 편집 SaaS 서비스. SNS/마케팅 담당자가 이미지 속 텍스트를 다른 텍스트로 자연스럽게 변환하고, 배경 제거/교체, 객체 제거, 업스케일링, 스타일 변환 등 다양한 AI 편집 기능을 웹 브라우저에서 바로 사용할 수 있는 서비스.

## Core Value

이미지 속 텍스트를 원본 스타일(폰트, 색상, 원근감)을 유지하면서 다른 텍스트로 자연스럽게 교체할 수 있어야 한다.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 이미지 업로드 및 캔버스에서 미리보기
- [ ] AI 기반 이미지 속 텍스트 감지 및 다른 텍스트로 변환
- [ ] 배경 제거 및 다른 배경으로 교체
- [ ] 이미지에서 불필요한 객체 AI 제거
- [ ] AI 업스케일링으로 해상도 향상
- [ ] 사진을 일러스트/애니메이션/수채화 등 스타일 변환
- [ ] 편집 결과 다운로드 (PNG, JPG, WebP)
- [ ] 사용자 회원가입/로그인
- [ ] 편집 히스토리 및 프로젝트 저장
- [ ] SaaS 요금제 및 결제 시스템

### Out of Scope

- 실시간 협업 편집 — v1에서는 개인 사용에 집중
- 모바일 네이티브 앱 — 웹 우선, 반응형으로 대응
- 동영상 편집 — 이미지 편집에 집중
- 자체 AI 모델 학습 — 외부 AI API 활용

## Context

- SNS/마케팅 용도: 배너, 썸네일, 광고 이미지의 텍스트를 다국어로 바꾸거나 문구 수정
- 텍스트 변환이 핵심 차별점 — 기존 서비스들은 배경 제거/객체 제거는 많지만, 이미지 내 텍스트 자연스러운 교체는 드물다
- SaaS 모델로 불특정 다수 대상 공개 서비스
- 프론트엔드: React + Vite (최신 버전)
- 백엔드: 별도 서버 (AI 모델 API 호출 처리)

## Constraints

- **Tech Stack (Frontend)**: React + Vite — 사용자 지정
- **Tech Stack (Backend)**: 별도 백엔드 서버 — AI API 호출, 인증, 결제 처리
- **AI Models**: 외부 AI API 활용 (자체 모델 학습 없음)
- **Target**: 웹 브라우저 (데스크톱 우선, 반응형)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + Vite 프론트엔드 | 사용자 선호, 빠른 개발 속도 | — Pending |
| 별도 백엔드 서버 | AI API 키 보호, 인증/결제 서버 필요 | — Pending |
| 이미지 내 텍스트 변환을 핵심 기능으로 | 경쟁 서비스 대비 차별점 | — Pending |
| SaaS 모델 | 불특정 다수 대상 공개 서비스 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-24 after initialization*
