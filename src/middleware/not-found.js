const notFoundMiddleware = (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
};

export default notFoundMiddleware;
