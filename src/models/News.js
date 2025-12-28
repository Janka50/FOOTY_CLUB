const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const News = sequelize.define('News', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sourceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'source_id',
    references: {
      model: 'news_sources',
      key: 'id'
    }
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'author_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  featuredImageUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'featured_image_url'
  },
  category: {
    type: DataTypes.ENUM('transfer', 'match_report', 'interview', 'injury', 'general', 'rumor'),
    allowNull: false
  },
  newsType: {
    type: DataTypes.ENUM('original', 'aggregated'),
    allowNull: false,
    defaultValue: 'original',
    field: 'news_type'
  },
  externalUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'external_url'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'view_count'
  },
  isBreaking: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_breaking'
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_published'
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    field: 'published_at'
  },
  metaDescription: {
    type: DataTypes.STRING(160),
    allowNull: true,
    field: 'meta_description'
  },
  metaKeywords: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    allowNull: true,
    field: 'meta_keywords'
  }
}, {
  tableName: 'news',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['category'] },
    { fields: ['is_published', 'published_at'] },
    { fields: ['slug'] },
    { fields: ['is_breaking'] },
    { fields: ['author_id'] }
  ]
});

News.prototype.incrementViews = async function() {
  this.viewCount += 1;
  await this.save({ fields: ['viewCount'] });
};

module.exports = News;