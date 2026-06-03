# TODO - feature/integration make it work

## Status: In progress

- [ ] Fix TypeScript errors after merge (lint/build)
  - [ ] src/config/env.ts: normalize JWT env vars used by src/utils/jwt.ts and src/utils/multer.ts
  - [ ] src/middlewares/auth.middleware.ts: export alias `authenticate` if routes expect it
  - [ ] src/routes/image.route.ts: align Role type usage and controller method call
  - [ ] src/services/auth.service.ts: instantiate UserRepository via DataSource (fromDataSource)
  - [ ] src/models/favorite.entity.ts: add missing relation fields (favorites) to User and Room entities, or adjust entity
- [ ] Re-run `npm run lint` and `npm run build`
- [ ] Start server and smoke test main routes (/health, /auth, /rooms, /bookings)

