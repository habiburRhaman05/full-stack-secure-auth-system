
import { vi } from "vitest";


vi.mock("../src/jobs/emailQueue", () => ({
  addEmailJob: vi.fn().mockResolvedValue(true),
}));


vi.mock("cloudinary", () => ({
  v2: {
    uploader: {
      upload: vi.fn().mockResolvedValue({ secure_url: "https://fake.url/img.jpg" }),
    },
  },
}));