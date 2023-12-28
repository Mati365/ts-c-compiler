export const ALLOCA_CONTENT_HEADER = /* c */ `
#ifndef ALLOCA_H
#define ALLOCA_H

#define alloca(total_bytes) __builtin_alloca(total_bytes)

#endif
`;
