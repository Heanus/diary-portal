const express = require('express')
const router = express.Router()
const utility = require('../config/utility')
const ResponseSuccess = require("../response/ResponseSuccess");
const ResponseError = require("../response/ResponseError");
const mysql = require("mysql");
const configDatabase = require("../config/configDatabase");
const { stat, writeFile } = require("fs");

const LOCK_FILE_NAME = 'DATABASE_LOCK'

router.get('/', (req, res, next) => {

    stat(LOCK_FILE_NAME, ((err, stats) => {
        if (err){
            // 如果没有该文件，说明数据库没有初始化过
            let tempConfigDatabase = {}
            Object.assign(tempConfigDatabase, configDatabase)
            delete tempConfigDatabase.database
            let connection = mysql.createConnection(tempConfigDatabase)
            connection.connect()
            const sqlCreation = 'CREATE DATABASE IF NOT EXISTS diary'
            connection.query(sqlCreation, [], function (err, result) {
                if (err){
                    console.log('- 1. fail : create db fails, \nwith err info: \n' + err.message)
                    res.send(new ResponseError(err, err.message))
                } else {
                    console.log('- 1. success: create db diary')
                    createTables()
                        .then(msg => {

                            writeFile(LOCK_FILE_NAME, 'Database has been locked, file add in ' + utility.dateFormatter(new Date()),err => {
                                if (err){
                                    res.send('初始化失败')
                                } else {
                                    res.send(
                                        '数据库初始化成功：<br>' +
                                        '数据库名： diary<br>' +
                                        '创建四张表：users、user_group、diaries、qrs <br>' +
                                        '已创建数据库锁定文件： ' + LOCK_FILE_NAME
                                    )
                                }
                            })

                        })
                        .catch(msg => {
                            res.send(msg)
                        })
                }
            })
            connection.end()
        } else {
            // 如果已经初始化过了
            res.send('该数据库已被初始化过，如果想重新初始化，请先删除项目中 <b>DATABASE_LOCK</b> 文件')
        }
    }))


})

function createTables(){
    return new Promise((resolve, reject) => {
        let connection = mysql.createConnection(configDatabase)
        console.log(configDatabase)
        connection.connect()
        const sqlCreateTables = `
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE diary;

-- ----------------------------
-- Table structure for diary_category
-- ----------------------------
DROP TABLE IF EXISTS \`diary_category\`;
CREATE TABLE \`diary_category\`  (
  \`sort_id\` tinyint(1) NULL DEFAULT NULL,
  \`name_en\` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '类别英文名',
  \`name\` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '类别名',
  \`count\` int(6) NOT NULL DEFAULT 0 COMMENT '类别日记的数量',
  \`color\` char(10) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '#cccccc' COMMENT '类别颜色',
  \`date_init\` datetime(0) NOT NULL,
  PRIMARY KEY (\`name_en\`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Records of diary_category
-- ----------------------------
INSERT INTO \`diary_category\` VALUES (9, 'article', '文章', 0, '#CC73E1', '2022-03-23 21:23:02');
INSERT INTO \`diary_category\` VALUES (3, 'bigevent', '大事', 0, '#FF3B30', '2022-03-23 21:23:02');
INSERT INTO \`diary_category\` VALUES (10, 'bill', '账单', 0, '#8bc34a', '2022-05-23 21:23:02');
INSERT INTO \`diary_category\` VALUES (8, 'film', '电影', 0, '#FF2D70', '2022-03-23 21:23:02');
INSERT INTO \`diary_category\` VALUES (7, 'game', '游戏', 0, '#5AC8FA', '2022-03-23 21:23:02');
INSERT INTO \`diary_category\` VALUES (1, 'life', '生活', 0, '#FF9500', '2022-03-23 21:23:02');
INSERT INTO \`diary_category\` VALUES (4, 'sport', '运动', 0, '#FFCC00', '2022-03-23 21:23:02');
INSERT INTO \`diary_category\` VALUES (2, 'study', '学习', 0, '#4CD964', '2022-03-23 21:23:02');
INSERT INTO \`diary_category\` VALUES (5, 'week', '周报', 0, '#5856D6', '2022-03-23 21:23:02');
INSERT INTO \`diary_category\` VALUES (6, 'work', '工作', 0, '#007AFF', '2022-03-23 21:23:02');


-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS \`users\`;
CREATE TABLE \`users\`  (
  \`uid\` int(11) NOT NULL AUTO_INCREMENT,
  \`email\` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  \`nickname\` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT '昵称',
  \`username\` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT '用户名',
  \`password\` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT '密码',
  \`register_time\` datetime(0) NULL DEFAULT NULL COMMENT '注册时间',
  \`last_visit_time\` datetime(0) NULL DEFAULT NULL COMMENT '最后访问时间',
  \`comment\` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '注释',
  \`wx\` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NULL DEFAULT '' COMMENT '微信二维码',
  \`phone\` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NULL DEFAULT NULL COMMENT '手机号',
  \`homepage\` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NULL DEFAULT NULL COMMENT '个人主页',
  \`gaode\` varchar(250) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NULL DEFAULT NULL COMMENT '高德组队邀请码',
  \`group_id\` int(11) NOT NULL DEFAULT 2 COMMENT '用户组别ID',
  \`count_diary\` int(8) NULL DEFAULT 0 COMMENT '数量 - 日记',
  \`count_dict\` int(8) NULL DEFAULT 0 COMMENT '数量 - 码表',
  \`count_qr\` int(8) NULL DEFAULT 0 COMMENT '数量 - 二维码',
  \`count_words\` int(8) NULL DEFAULT 0 COMMENT '数量 - 五笔词条',
  \`sync_count\` int(6) NULL DEFAULT 0 COMMENT '同步次数',
  PRIMARY KEY (\`uid\`, \`email\`) USING BTREE,
  INDEX \`group_id\`(\`group_id\`) USING BTREE,
  INDEX \`uid\`(\`uid\`) USING BTREE,
  CONSTRAINT \`group_id\` FOREIGN KEY (\`group_id\`) REFERENCES \`user_group\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 0 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = Compact;


-- ----------------------------
-- Table structure for user_group
-- ----------------------------
DROP TABLE IF EXISTS \`user_group\`;
CREATE TABLE \`user_group\`  (
  \`id\` int(11) NOT NULL AUTO_INCREMENT COMMENT '组别ID',
  \`name\` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT '组别名称',
  \`description\` varchar(255) CHARACTER SET utf8 COLLATE utf8_bin NULL DEFAULT NULL,
  PRIMARY KEY (\`id\`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 0 CHARACTER SET utf8 COLLATE utf8_general_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Records of user_group
-- ----------------------------
INSERT INTO \`user_group\` VALUES (1, 'admin', '管理员');
INSERT INTO \`user_group\` VALUES (2, 'user', '普通成员');


-- ----------------------------
-- Table structure for diaries
-- ----------------------------
DROP TABLE IF EXISTS \`diaries\`;
CREATE TABLE \`diaries\`  (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`date\` datetime(0) NOT NULL COMMENT '日记日期',
  \`title\` text CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '标题',
  \`content\` longtext CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT '内容',
  \`temperature\` int(3) NULL DEFAULT -273 COMMENT '室内温度',
  \`temperature_outside\` int(3) NULL DEFAULT -273 COMMENT '室外温度',
  \`weather\` enum('sunny','cloudy','overcast','sprinkle','rain','thunderstorm','fog','snow','tornado','smog','sandstorm') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'sunny' COMMENT '天气',
  \`category\` enum('life','study','film','game','work','sport','bigevent','week','article') CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT 'life' COMMENT '类别',
  \`date_create\` datetime(0) NOT NULL COMMENT '创建日期',
  \`date_modify\` datetime(0) NULL DEFAULT NULL COMMENT '编辑日期',
  \`uid\` int(11) NOT NULL COMMENT '用户id',
  \`is_public\` int(1) NOT NULL DEFAULT 0 COMMENT '是否共享',
  PRIMARY KEY (\`id\`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 0 CHARACTER SET utf8 COLLATE utf8_general_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for qrs
-- ----------------------------
DROP TABLE IF EXISTS \`qrs\`;
CREATE TABLE \`qrs\` (
  \`hash\` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL COMMENT 'hash',
  \`is_public\` int(11) NOT NULL DEFAULT 0 COMMENT '是否启用',
  \`message\` varchar(1000) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '挪车说明',
  \`description\` varchar(1000) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '简介',
  \`switch_phone\` int(11) NOT NULL DEFAULT 0 COMMENT '手机号 - 显示开关',
  \`car\` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '车辆标题',
  \`car_plate\` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '车牌号',
  \`switch_car\` int(11) NOT NULL DEFAULT 0 COMMENT '车辆 - 显示开关',
  \`car_desc\` varchar(1000) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin DEFAULT NULL COMMENT '车辆描述',
  \`switch_wx\` int(11) NOT NULL DEFAULT 0 COMMENT '微信二维码 - 显示开关',
  \`switch_homepage\` int(11) NOT NULL DEFAULT 0 COMMENT '个人主页 - 显示开关',
  \`switch_gaode\` int(11) NOT NULL DEFAULT 0 COMMENT '高德组队邀请码 - 显示开关',
  \`date_modify\` datetime DEFAULT NULL COMMENT '最后编辑日期',
  \`date_init\` datetime DEFAULT NULL COMMENT '注册时间',
  \`visit_count\` int(11) NOT NULL DEFAULT 0 COMMENT '被访问次数',
  \`uid\` int(6) NOT NULL COMMENT '所属用户 uid',
  \`imgs\` varchar(255) DEFAULT NULL COMMENT '图片地址',
  PRIMARY KEY (\`hash\`) USING BTREE,
  KEY \`username\` (\`uid\`) USING BTREE,
  CONSTRAINT \`code_ibfk_1\` FOREIGN KEY (\`uid\`) REFERENCES \`users\` (\`uid\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci ROW_FORMAT=COMPACT;


-- ----------------------------
-- Table structure for wubi_dict
-- ----------------------------
DROP TABLE IF EXISTS \`wubi_dict\`;
CREATE TABLE \`wubi_dict\`  (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`title\` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT '码表名',
  \`content\` text CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT '码表内容',
  \`content_size\` int(6) NULL DEFAULT 0 COMMENT '码表内容字数',
  \`word_count\` int(6) NULL DEFAULT 0 COMMENT '码表内容的词条数',
  \`date_init\` datetime(0) NOT NULL COMMENT '首次上传时间',
  \`date_update\` datetime(0) NULL DEFAULT NULL COMMENT '最后同步时间',
  \`comment\` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '注释',
  \`uid\` int(11) NULL DEFAULT NULL COMMENT '所属用户',
  PRIMARY KEY (\`id\`, \`title\`) USING BTREE,
  INDEX \`uid\`(\`uid\`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 0 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = Compact;


SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for thumbs_up
-- ----------------------------
DROP TABLE IF EXISTS \`thumbs_up\`;
CREATE TABLE \`thumbs_up\` (
  \`name\` varchar(50) NOT NULL,
  \`count\` int(11) NOT NULL DEFAULT 0 COMMENT '点赞数',
  \`description\` varchar(255) DEFAULT NULL COMMENT '说明',
  \`link_address\` varchar(100) DEFAULT NULL COMMENT '部署地址',
  \`date_init\` datetime NOT NULL COMMENT '添加地址',
  PRIMARY KEY (\`name\`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci ROW_FORMAT=DYNAMIC;


SET FOREIGN_KEY_CHECKS = 1;
`
        connection.query(sqlCreateTables, [], function (err, result) {
            console.log('result: ', result)
            if (err){
                console.log('-- 2. fail: create table diaries, users')
                reject('失败：新建 tables: users, diaries，\ninfo: \n' + err.message)
            } else {
                console.log('-- 2. success: create table diaries, users')
                resolve('成功：新建 tables: users, diaries')
            }
        })
        connection.end()
    })
}

module.exports = router
