/* file: hola-fb.js
 *
 * brief: facebook javascript sdk wrapper
 *
 * author: johnny <johnny.yin@holaverse.com>
 *
 * created: 2016.8.18
 *
 */

var HolaFB = function(options) {
  this.options = options;
  this._init(options);

  FB.Canvas.setDoneLoading();
  
  this.subscribe('auth.authResponseChange', this._onAuthResponseChange.bind(this));
  this.subscribe('auth.statusChange', this._onStatusChange.bind(this));
};


HolaFB.FRIEND_SHARE = 0;
HolaFB.FRIEND_NONIFICATIONS = 1;
HolaFB.FRIEND_REQUEST = 2;
HolaFB.FRIEND_SCORE = 3;

HolaFB.friendCache = {
  me: {},
  user: {},
  permissions: [],
  friends: [],
  invitable_friends: [],
  apprequests: [],
  scores: [],
  games: [],
  reRequests: {}
};

HolaFB.prototype.setServerUrl = function(url) {
  this.server_url = url;
}

HolaFB.prototype.setAppNamespace = function(name) {
  this.appNamespace = name;
  this.appCenterURL = '//www.facebook.com/appcenter/' + name;
} 

HolaFB.prototype._getFriendCacheData = function(endpoint, options) {
  if(endpoint) {
    var url = '/';
    if(endpoint == 'me') {
      url += endpoint;
    } else if(endpoint == 'scores') {
      url += this.appId + '/' + endpoint;
    } else {
      url += 'me/' + endpoint;
    }
    return new Promise(function(resolve, reject) {
        FB.api(url, options, function(response) {
          if( !response.error ) {
            HolaFB.friendCache[endpoint] = response.data ? response.data : response;
            resolve(response);
          } else {
            reject('getFriendCacheData', endpoint, response);
          }
        });
    });
  } else {
    var that = this;
    return that.getMe()
      .then(function() {
        return that.getPermissions();
      })
      .then(function() {
        return that.getFriends();
      })
      .then(function() {
        return that.getInvitableFriends();
      })
      .then(function() {
        return that.getScores();
      });
  }
};

HolaFB.prototype._init = function(options) {
  if(!options || !options.appId) {
    throw new Error('no app id');
  }
  if(!options.version) {
    throw new Error('no sdk version');
  }
  
  this.appId = options.appId || '170644446692851';
  FB.init({
    appId      : options.appId || '170644446692851',
    frictionlessRequests: true,
    status: true,
    version    : options.version || 'v2.7'
  });
};

HolaFB.prototype.getLoginStatus = function() {
  return new Promise(function(resolve, reject) {
    FB.getLoginStatus(function(response) {
      resolve(response);
    });
  }); 
};

HolaFB.prototype.getMe = function() {
  var that = this;
  return new Promise(function(resolve, reject) {
    that._getFriendCacheData('me',
      {fields: 'id,name,first_name,picture.width(120).height(120)'})
    .then(function(response) {
      resolve(response);
    }).catch(function(error) {
      reject(error);
    });
  });
};

HolaFB.prototype.getPermissions = function() {
  var that = this;
  return new Promise(function(resolve, reject) {
    that._getFriendCacheData('permissions')
    .then(function(response) {
      resolve(response);
    }).catch(function(error) {
      reject(error);
    });
  });
};

HolaFB.prototype.hasPermission = function(permission) {
  var friendCache = HolaFB.friendCache;
  for( var i in friendCache.permissions ) {
    if(
      friendCache.permissions[i].permission == permission
      && friendCache.permissions[i].status == 'granted' )
      return true;
  }
  return false;
};

HolaFB.prototype.getFriends = function() {
  var that = this;
  return new Promise(function(resolve, reject) {
    that._getFriendCacheData('friends', 
      {fields: 'id,name,first_name,picture.width(120).height(120)',limit: 8})
    .then(function(response) {
      resolve(response);
    })
    .catch(function(error) {
      reject(error);
    });
  });
};

HolaFB.prototype.getInvitableFriends = function() {
  var that = this;
  return new Promise(function(resolve, reject) {
    that._getFriendCacheData('invitable_friends',
      {fields: 'name,first_name,picture',limit: 8})
    .then(function(response) {
      resolve(response);
    })
    .catch(function(error) {
      reject(error);
    });
  });
};

HolaFB.prototype.getScores = function() {
  var that = this;
  return new Promise(function(resolve, reject) {
    that._getFriendCacheData('scores', 
      {fields: 'score,user.fields(first_name,name,picture.width(120).height(120))'})
    .then(function(response) {
      resolve(response);
    })
    .catch(function(error) {
      reject(error);  
    });
  }); 
};

HolaFB.prototype.login = function(options) {
  return new Promise(function(resolve, reject) {
      FB.login(function(response){
        resolve(response);
      }, options);
  });
};

HolaFB.prototype.logout = FB.logout;

////////////////////////////////////
//分享对话框
HolaFB.prototype.share = function() {
  return new Promise(function(resolve, reject) {
    FB.ui({
      method: 'share',
      href: 'http://apps.facebook.com/' + this.appNamespace + '/share.php'
    }, function(response){
      resolve(response);
    });
  });
};

HolaFB.prototype.like = function() {
  return new Promise(function(resolve, reject) {
    FB.api(
      '/me/og.likes',
      'post', 
      {
        object: 'http://techcrunch.com/2013/02/06/facebook-launches-developers-live-video-channel-to-keep-its-developer-ecosystem-up-to-date/',
        privacy: {'value': 'SELF'},
      },
      function(response){
        if(!response){
          reject('Error occured.');
        } else if(response.error) {
          reject('Error occured.' + response.error);
        } else {
          resolve(response);
        }
      }
    );
  });
}

//动态发布对话框
HolaFB.prototype.feed = function() {
  return new Promise(function(resolve, reject) {
    FB.ui({
      method: 'feed',
      link: 'https://developers.facebook.com/docs/',
      caption: 'An example caption',
    }, function(response){
      if(!response || response.error){
        reject(response ? response.error : "feed failed");
      } else {
        resolve(response);
      }
    });
  });
}

HolaFB.prototype.apiFeed = function() {
  return new Promise(function(resolve, reject) {
    FB.api(
      "/me/feed",
      "POST",
      {
        "message": "This message is from api feed",
        "link": "http://www.baidu.com",
        "caption": "Baidu",
        "picture": "https://www.baidu.com/img/bd_logo1.png"
      }, function(response){
      if(!response || response.error){
        reject(response ? response.error : "feed failed");
      } else {
        resolve(response);
      }
    });
  });
}

/* 
 * 调起发送对话框,发送消息到对方的聊天对话框
 *
 * @param {url} 需要分享的链接
 *
 * @return a promise object
 */
HolaFB.prototype.send = function(url) {
  return new Promise(function(resolve, reject) {
    FB.ui({
      method: 'send',
      link: url,
    }, function(response) {
      if(!response || response.error){
        reject(response ? response.error : "feed failed");
      } else {
        resolve(response);
      }
    });
  });
}

/*
 * 向某用户发送一条通知
 *
 * @param {to} 必填，目标用户的user id，不能是自己
 * @param {template} 必填， 通知文字描述
 * @param {href} 目标链接
 *
 * @return Promise对象
 */
HolaFB.prototype.sendNotification = function(to, template, href) {
  if(!to || !template){
    throw new Error("invalid parameter");
  }
  
  var option = {template: template};
  if(href) {
    option.href = href;
  }
  return new Promise(function(resolve, reject) {
    FB.api(
      '/' + to + '/notifications',
      'POST',
      option,
      function(response) {
        if(!response || response.error){
          reject(response ? response.error : 'send notification failed')
        } else {
          resolve(response);
        }
      }
    )
  });
}

HolaFB.prototype.sendBrag = function(caption, name, picture) {
  return new Promise(function(resolve, reject) {
    FB.ui({ method: 'feed',
      caption: caption,
      picture: picture,
      name: name || 'Checkout my greatness game!'
    }, function() {
      resolve();
    });
  });
};

/*
 * 发送分数，只有超过最高分才会被resolve,否则被reject
 * @param {score} 分数
 *
 * @return Promise对象
 */
HolaFB.prototype.sendScore = function(score) {
  return new Promise(function(resolve, reject) {
    // Check current score, post new one only if it's higher
    FB.api('/me/scores', function(response) {
      // Score will be returned in a JSON array with 1 element. Refer to the Graph
      // API documentation below for more information:
      // https://developers.facebook.com/docs/graph-api/reference/app/scores
      if( response.data &&
        response.data[0] &&
        response.data[0].score >= score ) {
        reject('Lower score not posted to Facebook', score, response);
      }
      else {
        FB.api('/me/scores', 'post', { score: score }, function(response) {
          if( response.error ) {
            reject('sendScore failed', score, response);
          } else {
            resolve();
          }
        });
      }
    });
  });
}

////////////////////////////////////
/*
 * 调起挑战对话框
 * @param {to} 被挑战者user id
 * @param {message} 挑战信息
 * @param {turn} 回合制游戏
 *
 * @return Promise对象
 */
HolaFB.prototype.sendChallenge = function(to, message, turn) {
  var options = {
    method: 'apprequests'
  };
  if(to) options.to = to;
  if(message) options.message = message;
  if(turn) options.action_type = 'turn';
  return new Promise(function(resolve, reject) {
    FB.ui(options, function(response) {
      resolve(response);
    });
  });
}

/*
 * @param {to} 被请求者user id
 * @param: {option}
 * option.action_type: enum{SEND, ASKFOR, TURN, GIFT, INVITE, RECOMMEND}, 请求对象类型
 * option.data: string, 作为请求对象的补充信息，最长255字节
 * option.from: int, 发送者ID
 * option.message: string, 必填,请求的信息
 * option.object_id numeric string or integer, 开放图谱对象ID
 *
 * @return Promise对象
 *
 * @reference https://developers.facebook.com/docs/graph-api/reference/user/apprequests/
 */
HolaFB.prototype.apiAppRequests = function(to, option) {
  if(!to || !option) {
    throw new Error("invalid param");
  }
  if(option.action_type) {
    var at = option.action_type.toLowerCase();
    if((at == "send" || at == "askfor") && !option.object_id){
      throw new Error("invalid param, object_id needed");
    }
  }
  return new Promise(function(resolve, reject){
    FB.api(
    "/" + to + "/apprequests",
    option,
    function(response){
      if (response && !response.error){
        resolve(response);
      } else {
        reject();
      }
    });
  });
}

/*
 * 通过图谱API发送挑战
 * @param {to} 被挑战者user id
 * @param {message} 挑战信息
 * @param {turn} 是否回合制游戏
 *
 * @return Promise对象
 */
HolaFB.prototype.apiChallenge = function(to, message, turn) {
  var options = {};
  if(message) options.message = message;
  if(turn) options.action_type = 'turn';
  
  return this.apiAppRequests(to, options);
}

/*
 * 通过图谱API发送邀请
 * @param {to} 被邀请者user id
 * @param {message} 邀请信息
 *
 * @return Promise对象
 */
HolaFB.prototype.apiInvite = function(to, message) {
  var options = {};
  if(message) options.message = message;
  options.action_type = "invite";
  
  return this.apiAppRequests(to, options); 
}

HolaFB.prototype.apiRecommend = function(to, message) {
  var options = {};
  if(message) options.message = message;
  options.action_type = "recommend";

  return this.apiAppRequests(to, options);
}

HolaFB.prototype.getRequestInfo = function(id){
  return new Promise(function(resolve, reject) {
    FB.api(String(id), {fields: 'from{id,name,picture}' }, function(response){
      if( response.error ) {
        reject(response.error);
        return;
      }
      resolve(response);
    });
  });
}

HolaFB.prototype.deleteRequest = function(id, callback) {
  return new Promise(function(resolve, reject) {
    FB.api(String(id), 'delete', function(response){
      if( response.error ) {
        rejecgt(response.error)
        return;
      }
      resolve(response);
    });
  });
}

/////////////////////////////////////////
//achievement
HolaFB.prototype.registerAchievement = function(id) {
  return new Promise(function(resolve, reject) {
    if(!id || typeof id !== 'string'){
      reject('invalid achievement id');
    }
  });
}

HolaFB.prototype.sendAchivement = function(id) {
  return new Promise(function(resolve, reject) {
    if(!id || typeof id !== 'string'){
      reject('invalid achievement id');
    }
    FB.api(
      "/me/achievements",
      "POST",
      {
        "achievement": id
      },
      function (response) {
        if (response && !response.error) {
          resolve(response);
          return;
        }
        reject(response && response.error);
      });
  });
}

HolaFB.prototype.getMyAchievement = function() {
  return new Promise(function(resolve, reject) {
    FB.api(
    "/me/achievements",
    function (response) {
      if (response && !response.error) {
          resolve(response);
          return;
      }
      reject(response && response.error);
    });
  });
}

/////////////////////////////////////////
//core
HolaFB.prototype.subscribe = function(id, callback) {
  FB.Event.subscribe(id, callback);
};

/////////////////////////////////////////
//canvas
HolaFB.prototype.setUrlHandler = function(handler) {
  FB.Canvas.setUrlHandler(handler);
};

////////////////////////////////////////
//private callback
HolaFB.prototype._onAuthResponseChange = function(response) {
  console.log('_onAuthResponseChange', response);
  if( response.status == 'connected' ) {
    this.getPermissions();
  }
}

HolaFB.prototype._onStatusChange = function(response) {
  console.log('_onStatusChange', response);
  if( response.status != 'connected' ) {
    this.login();
  } else {
  }
}

/////////////////////////////////////////
//app events
HolaFB.prototype.logEvent = function(eventName, valueToSum, parameters) {
  return FB.AppEvents.logEvent(events, valueToSum, parameters);
  
}

HolaFB.prototype.logPurchase = function(purcaseAmount, currency, parameters) {
  return FB.AppEvents.logPurchase(purcaseAmount, currency, parameters);
}

window.HolaFB = HolaFB;

