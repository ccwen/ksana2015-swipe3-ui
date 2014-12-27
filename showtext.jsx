//var Dictionary=require("ksana2015-dictionary-ui");
var Controls = React.createClass({
  getInitialState: function() {
    return {pagename:this.props.pagename};
  },
  updateValue:function(e){
    if (e.key!="Enter") return;
    var newpagename=this.refs.pagename.getDOMNode().value;
    this.props.setpage(newpagename);
  },  
  shouldComponentUpdate:function(nextProps,nextState) {
    this.refs.pagename.getDOMNode().value=nextProps.pagename;
    nextState.pagename=nextProps.pagename;
    return true;
  },
  gotoToc:function() {
    this.props.syncToc(); 
  },
  render: function() {   
   return <div className="inputs">
      <button onClick={this.gotoToc}>TOC</button>
      <span>___</span>
      <button onClick={this.props.prev}>{" \u25c0 "}</button>
       <input size="8" type="text" ref="pagename" onKeyUp={this.updateValue}></input>
      <button onClick={this.props.next}>{" \u25b6 "}</button>
      </div>
  }  
});
var addbr=function(t) {
  return t.split("\n").map(function(line){return line+" <br/>"}).join("\n");
};

var Showtext = React.createClass({
  getInitialState: function() {
    return {dicttofind:""};
  },
  touchdistance:function(start,end) {
    var dx=end[0]-start[0];
    var dy=end[1]-start[1];
    return Math.sqrt(dx*dx+dy*dy);
  },
  touchstart:function(e) {
    this.touching=e.target;
    this.touchpos=[e.targetTouches[0].pageX,e.targetTouches[0].pageY];
  },
  touchend:function(e){
    var touching=this.touching;
    this.touching=null;
    if (e.target!=touching) {
      return;
    }
    var touchpos=[e.changedTouches[0].pageX,e.changedTouches[0].pageY];
    var dist=this.touchdistance(this.touchpos,touchpos);
    if (dist<5) this.checkUnderTap(e);
  },
  checkUnderTap:function(e) {
    var span=e.target;
    this.props.action("showtext.ontap",e);
    if (span.nodeName!="SPAN" || span.parentElement.classList[0]!="bodytext") return;
    if (this.props.dictionaries && this.props.dictionaries.length) {
      this.setState({dicttofind:span});
    }
  },
//          <Dictionary dictionaries={this.props.dictionaries}  tofind={this.state.dicttofind}/>
  render: function() {
    var pn=this.props.pagename;
    return ( 
      <div>
        <Controls pagename={this.props.pagename} next={this.props.nextpage} 
        prev={this.props.prevpage} setpage={this.props.setpage}
        syncToc={this.props.syncToc}/>

        <div onTouchStart={this.touchstart} 
             onTouchEnd={this.touchend} 
             onClick={this.checkUnderTap} 
             className="bodytext" 
             dangerouslySetInnerHTML={{__html:addbr(this.props.text||"")}} />
      </div>
    );
  }
});
module.exports=Showtext;