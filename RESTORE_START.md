# KnitMate Restore Start

## Start Here
- Worktree path: `/private/tmp/knitmate-mvp-3da8eb8`
- Branch: `restore-mvp-rebuild`
- Baseline commit: `3da8eb8` (`Initial KnitMate MVP`)
- Main repo path to keep untouched: `/Users/sangbinsmacbook/Desktop/Projects/KnitMate`

## First Goal
- Reconfirm that MVP boots on the iPhone as the stable baseline.
- Do not add SNS or auth changes before MVP is confirmed.

## Tomorrow Order
1. Open this worktree in the editor.
2. Run dependency setup if needed.
3. Verify MVP on iPhone via Xcode Run.
4. Create checkpoint commit for MVP stability.
5. Rebuild local knitting workflow in this order:
   - `뜨개방`
   - project create/edit
   - `이어뜨기`
   - `기록`
   - project timeline
6. Only after local workflow is stable, restore the full tab shell:
   - `뜨개방`
   - `피드`
   - `+`
   - `뜨모저모`
   - `프로필`

## Rules
- Keep current `main` as preservation-only.
- Use this worktree as the rebuild track.
- Cherry-pick only stable checkpoints back into `main`.
- SNS content must remain remote-only.
- Local project flow must work without login.
