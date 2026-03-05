let ioInstance = null;

export const setIo = (io) => {
  ioInstance = io;
};

export const getIo = () => ioInstance;

export const emitToUser = (userId, event, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${String(userId)}`).emit(event, payload);
};
