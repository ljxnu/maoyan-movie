Page({
  onShareAppMessage(res){
    return {
      title:'精仿猫眼电影',
      path:'pages/tabBar/movie/movie'
    }
  },
  snack(){
    wx.showModal({
      title:"提示",
      content:"暂未开放"
    })
  }
})