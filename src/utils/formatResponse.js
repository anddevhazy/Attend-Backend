const formatResponse = (res, statusCode, data, message = null) => {
  const response = { success: true, data };
  if (message) response.message = message;
  return res.status(statusCode).json(response);
};

export default formatResponse;
