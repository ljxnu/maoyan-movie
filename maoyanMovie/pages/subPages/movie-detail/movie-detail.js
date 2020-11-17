const util = require('../../../utils/util.js')
const request = require('../../../utils/request')

Page({
  data:{
    detailMovie: null, //电影详情
    ifFold:false,
    comments:{}, //观众评论
    actors:{} //演员列表
  },
  onLoad(options){
    const movieId = options.movieId
    this.initPage(movieId)
  },
  //初始化页面
  initPage(movieId){
    const _this = this
    wx.showLoading({
      title: '加载中...',
    })
    this.getActor(movieId)
    this.getComment(movieId)
    request({
      url: `https://m.maoyan.com/hostproxy/mmdb/movie/v5/${movieId}.json?ci=284`,
    }).then(([res]) => {
      _this.setData({
        detailMovie: _this.handleData(res.data.movie)
      })
    }).finally(() => {
      wx.hideLoading()
    })
  },
  //获取观众的评论
  getComment(movieId){
    const _this = this
    request({
      url:`https://m.maoyan.com/hostproxy/mmdb/comments/movie/v2/${movieId}.json`,
    }).then(([res]) =>{
      _this.setData({
         comments : _this.formatData(res.hcmts.slice(0,3))
      })
    })
  },
  //获取演职人员
  getActor(movieId){
    const _this = this
  request({
    url: `https://m.maoyan.com/hostproxy/mmdb/v7/movie/${movieId}/celebrities.json`,
  }).then(([res]) =>{
    _this.setData({
      actors : _this.formatActors(res.data[0].concat(res.data[1]))
    })
  })
  },
  
    //处理评分星星
  formatStar(sc){
    //1分对应满星，0.5对应半星
    let stars = new Array(5).fill('star-empty')
    const fullStars = Math.floor(sc)  //满星的个数
    const halfStar = sc % 1 ? 'star-half' : 'star-empty' //半星的个数，半星最多1个
    stars.fill('star-full', 0, fullStars)              //填充满星
    if (fullStars < 5) {
      stars[fullStars] = halfStar;           //填充半星
    }
    return stars
  },
   //处理数据
   formatData(arr) {
    let list = []
    if (arr.length) {
      list = arr.map(item => {
        let temp = { ...item }
        temp.avatarurl = temp.avatarurl || '/assets/images/avatar.png'
        temp.purchase = !!(temp.tagList && temp.tagList.fixed.some(item => item.id === 4))
        temp.stars = this.formatStar(temp.score)
        temp.calcTime = util.calcTime(temp.startTime)
        return temp
      })
    }
    return list
  },
  //获取演员数据
  formatActors(arr){
    let list = []
     if(Array.isArray(arr)){
       arr.forEach(item => {
       list.push({
         ...item,
         avatar : item.avatar.replace('w.h', '128.182')
       })
       })
     }
     return list
  },
   
  //处理数据
  handleData(data){
    //小程序的{{}}中不能调用函数，只能在这里处理函数
    let obj = data
    obj.img = obj.img.replace('w.h', '177.249')
     //将类似“v3d imax”转化为['3D','IMAX']
     obj.version = obj.ver.substr(0,7)
    //将评分人数单位由个转化为万
    obj.snum = obj.snum/10000
    obj.snum = obj.snum.toFixed(1)
    //评分星星,满分10分，一颗满星代表2分
    obj.stars = this.formatStar(obj.sc/2)
    //处理媒体库的图片
    obj.photos = obj.photos.map(item => item.replace('w.h/', '') +'@180w_140h_1e_1c.webp')
    return obj
  },
   //折叠与展开剧情简介
   toggleFold(){
    this.setData({
      isFold:!this.data.isFold
    })
  },
 //跳转到video页面
 toVideo(){
  const detailMovie = this.data.detailMovie;
  const paramsStr = JSON.stringify({
    video:{
      videourl: detailMovie.videourl,
      videoImg: detailMovie.videoImg,
      videoName: detailMovie.videoName,
    },
    movieName: detailMovie.nm,  //电影名称
    id: detailMovie.id,//电影ID
    version: detailMovie.version, //电影类型（3d、IMAX）
    release: detailMovie.pubDesc, //上映时间
    rt: detailMovie.rt,//电影上映时间
    wish: detailMovie.wish, //想看的人数
    globalReleased: detailMovie.globalReleased, //是否上映
    sc: detailMovie.sc, //评分
    showst: detailMovie.showst//判读“想看”、“预售”
  })
  wx.navigateTo({
    url: `../video-page/video-page?paramsStr=${paramsStr}`
  })
}
})