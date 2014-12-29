var Resultlist=React.createClass({  //should search result
  show:function() {  
    return this.props.res.excerpt.map(function(r,i){ // excerpt is an array 
      if (! r) return null;
      return React.createElement("div", {"data-vpos": r.hits[0][0]}, 
      React.createElement("a", {href: "#", onClick: this.gotopage, className: "sourcepage"}, r.pagename), ")", 
      React.createElement("span", {className: "resultitem", dangerouslySetInnerHTML: {__html:r.text}})
      )
    },this);
  },
  gotopage:function(e) {
    var vpos=parseInt(e.target.parentNode.dataset['vpos']);
    this.props.gotopage(vpos);
  },
  render:function() { 
    if (this.props.res) return React.createElement("div", null, this.show());
    else return React.createElement("div", null, "Not Found");
  } 
}); 

module.exports=Resultlist;