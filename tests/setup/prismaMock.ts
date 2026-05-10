

import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";
import { beforeEach, vi } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { PrismaClient } from "../../src/generated/prisma/client";

vi.mock("../../src/config/prisma", () => ({
  default: mockDeep<PrismaClient>(),
}));


export const prismaMock = prisma as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});