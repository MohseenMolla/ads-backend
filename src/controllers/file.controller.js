import File from "../models/File.js";
import cloudinary from "../config/cloudinary.js";

export const uploadFile = async (req, res) => {

  try {

    const result = await cloudinary.uploader.upload(req.file.path, {
  resource_type: "raw"
});

    const file = await File.create({
      user: req.user._id,
      title: req.body.title,
      type: "file",
      fileUrl: result.secure_url,
      publicId: result.public_id
    });

    res.json(file);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};


export const saveLink = async (req, res) => {

  const { title, link } = req.body;

  const data = await File.create({
    user: req.user._id,
    title,
    type: "link",
    link
  });

  res.json(data);

};


export const saveText = async (req, res) => {

  const { title, text } = req.body;

  const data = await File.create({
    user: req.user._id,
    title,
    type: "text",
    text
  });

  res.json(data);

};


export const getMyFiles = async (req, res) => {

  const files = await File.find({ user: req.user._id });

  res.json(files);

};


export const deleteFile = async (req, res) => {

  const file = await File.findById(req.params.id);

  if (!file) {
    return res.status(404).json({ message: "Not found" });
  }

  if (file.type === "file") {
    await cloudinary.uploader.destroy(file.publicId);
  }

  await file.deleteOne();

  res.json({ message: "Deleted" });

};