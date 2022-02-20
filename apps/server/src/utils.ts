function getChunksTotalByteLength(chunks) {
  return chunks.reduce((sumBytes, chunk) => sumBytes + chunk.byteLength, 0);
}

export function copyChunksIntoBuffer(chunks, targetBuffer = null): Buffer {
  if (!targetBuffer) {
    const totalSize = getChunksTotalByteLength(chunks);
    targetBuffer = Buffer.alloc(totalSize);
  }
  let offset = 0;
  for (let i = 0; i < chunks.length; i++) {
    if (offset >= targetBuffer.length) {
      throw new Error("Target buffer to merge chunks in is too small");
    }
    Buffer.from(chunks[i]).copy(targetBuffer, offset);
    offset += chunks[i].byteLength;
  }
  return targetBuffer;
}
