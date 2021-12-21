'use strict';
module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    userId: {
      allowNull: false,
      type: DataTypes.INTEGER,
      references: {model: 'Users'}
    },
    description: {
      allowNull: false,
      type: DataTypes.TEXT
    },
    isCompleted: {
      defaultValue: false,
      type: DataTypes.BOOLEAN
    },
    dueDate: {
      type: DataTypes.DATE
    },
    givenTo: {
      defaultValue: null,
      type: DataTypes.INTEGER,
      references: {model: 'Users'}
    },
  }, {});
  Task.associate = function(models) {
    // associations can be defined here
    Task.belongsToMany(models.List, {foreignKey: 'taskId', through: "TaskList", otherKey: 'listId'})
    Task.belongsTo(models.User, {foreignKey: 'givenTo'});
    Task.belongsTo(models.User, {foreignKey: 'userId'});
    Task.hasMany(models.Comment, {foreignKey: 'taskId', onDelete: 'CASCADE', hooks: true});

    Task.hasMany(models.TaskList, { foreignKey: 'taskId', onDelete: 'CASCADE', hooks: true });
  };
  return Task;
};
