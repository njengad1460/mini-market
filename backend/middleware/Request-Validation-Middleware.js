// Usage: validate(schema) where schema is a Joi object schema
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({ message: 'Validation failed', errors: messages });
  }

  next();
};

export default validate;
