var Resultlist=React.createClass({  //should search result
  show:function() {  
    return this.props.res.excerpt.map(function(r,i){ // excerpt is an array 
      if (! r) return null;
      return <div data-vpos={r.hits[0][0]}>
      <a href="#" onClick={this.gotopage} className="sourcepage">{r.pagename}</a>)
      <span className="resultitem" dangerouslySetInnerHTML={{__html:r.text}}></span>
      </div>
    },this);
  },
  gotopage:function(e) {
    var vpos=parseInt(e.target.parentNode.dataset['vpos']);
    this.props.gotopage(vpos);
  },
  render:function() { 
    if (this.props.res) return <div>{this.show()}</div>
    else return <div>Not Found</div>
  } 
}); 

module.exports=Resultlist;