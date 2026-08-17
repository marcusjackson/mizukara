"""Generate solid-color PNG PWA icons using Python stdlib."""
import struct
import zlib


def create_png(width: int, height: int, r: int, g: int, b: int) -> bytes:
    """Create a solid color PNG file using stdlib only."""

    def chunk(name: bytes, data: bytes) -> bytes:
        c = struct.pack(">I", len(data)) + name + data
        crc = zlib.crc32(name + data) & 0xFFFFFFFF
        return c + struct.pack(">I", crc)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    ihdr = chunk(b"IHDR", ihdr_data)

    raw_row = bytes([r, g, b] * width)
    raw_data = b"".join(b"\x00" + raw_row for _ in range(height))
    compressed = zlib.compress(raw_data)
    idat = chunk(b"IDAT", compressed)
    iend = chunk(b"IEND", b"")

    return sig + ihdr + idat + iend


# Theme color #5a8a94 = (90, 138, 148)
R, G, B = 90, 138, 148

import os  # noqa: E402

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

for size in [192, 512]:
    png_data = create_png(size, size, R, G, B)
    fname = os.path.join(base_dir, "public", f"pwa-{size}x{size}.png")
    with open(fname, "wb") as f:
        f.write(png_data)
    print(f"Generated {fname} ({len(png_data)} bytes)")

print("Done!")
