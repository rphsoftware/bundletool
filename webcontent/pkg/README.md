# OneLoaderImageDelta
image delta format meant for omori modding 

The bitstream is as follows:

```
Header:        0xFE 0xFF 0xD8 0x08 0xDD 0x21
Target Width:  4 bytes (Big Endian u32)
Target height: 4 bytes (Big Endian u32)
Unique Ident.: 8 bytes (Please generate them randomly, and discard unless used for caching)
CompressedLen: 4 bytes (Big Endian u32)

zlib( repeated TileStreams for each affected tile )
```

Tilestream format:

```
Tile X:       2 bytes (Big Endian u16) [Where the tile is, position on the image is 16 * tileX]
Tile Y:       2 bytes (Big Endian u16) [Where the tile is, position on the image is 16 * tileY]
BitstreamLen: 4 bytes (Big Endian u32) [Length of the subsequent bitstream]
Bitmask:      32 bytes (Each bit is associated directly with one pixel, going from left to right, top to bottom), if a bit is 1, that pixel is replaced
In the same order as in the bitmask the pixel values are stored now, for each one, 4 bytes, and the ordering is the same, unchangd pixels ommited
R: 1 byte Red
G: 1 byte Green
B: 1 byte Blue
A: 1 byte Alpha
```
