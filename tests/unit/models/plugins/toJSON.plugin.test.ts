import mongoose, { Document, Model } from 'mongoose';
import { toJSON } from '@/models/plugins';

let connection: mongoose.Connection;

describe('toJSON plugin', () => {

  beforeEach(() => {
    connection = mongoose.createConnection();
  });

  test('should replace _id with id', () => {
    const schema = new mongoose.Schema();
    schema.plugin(toJSON);
    const TestModel: Model<Document> = connection.model('TestModel', schema);
    const doc = new TestModel();
    expect(doc.toJSON()).not.toHaveProperty('_id');
    expect(doc.toJSON()).toHaveProperty('id', doc._id.toString());
  });

  test('should remove __v', () => {
    const schema = new mongoose.Schema();
    schema.plugin(toJSON);
    const TestModel: Model<Document> = connection.model('TestModel', schema);
    const doc = new TestModel();
    expect(doc.toJSON()).not.toHaveProperty('__v');
  });

  test('should remove createdAt and updatedAt', () => {
    const schema = new mongoose.Schema({}, { timestamps: true });
    schema.plugin(toJSON);
    const TestModel: Model<Document> = connection.model('TestModel', schema);
    const doc = new TestModel();
    expect(doc.toJSON()).not.toHaveProperty('createdAt');
    expect(doc.toJSON()).not.toHaveProperty('updatedAt');
  });

  test('should remove any path set as private', () => {
    const schema = new mongoose.Schema({
      public: { type: String },
      private: { type: String, private: true },
    });
    schema.plugin(toJSON);
    const Model = connection.model('Model', schema);
    const doc = new Model({ public: 'some public value', private: 'some private value' });
    expect(doc.toJSON()).not.toHaveProperty('private');
    expect(doc.toJSON()).toHaveProperty('public');
  });
});
