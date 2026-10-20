FROM node:24-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates tesseract-ocr poppler-utils util-linux && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=build_ca if [ -f /run/secrets/build_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/build_ca; fi; npm ci
COPY scripts/install-ocr.mjs scripts/install-ocr.mjs
RUN --mount=type=secret,id=build_ca if [ -f /run/secrets/build_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/build_ca; fi; node scripts/install-ocr.mjs && chown -R node:node /app/.cache
COPY lib ./lib
COPY scripts/document-worker.ts scripts/extract-document.ts ./scripts/
RUN chmod a+r package.json package-lock.json && chmod -R a+rX lib scripts
USER node
ENV NODE_ENV=production
CMD ["npm", "run", "worker"]
