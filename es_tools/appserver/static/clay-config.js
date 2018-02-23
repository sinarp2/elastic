require([ 
      "splunkjs/mvc", 
      "splunkjs/mvc/utils", 
      "jquery",
      "pwdEdit",
      "util",
      "text!../app/Clay/templates/clay-config.html",
 	  "css!../app/Clay/templates/css/clay-config.css"
    ],
    function( mvc, utils, $, pwdEdit, util, template ) {
		
	    $("#clayServer").append($(template));
	    var oldData , form;
	    var init = function(){
	    	form = $('#config_form');
	    	var load =  util.sendReq('getConfig');
		    load.done(function(result){
		    	var el;
		    	if(result['ok']){
		    		$.each(result,function(key,val){
			    		
		    			if( key==='ok'|| key==='error') return ;
		    			
		    			form.find('[name='+key+']').val(val).prop('selected',true);
			    		
			    	});
		    		
		    		oldData = form.serializeArray();
		    	}else{
					util.showPopup(result['error']);
				}
		    	
		    });
		    form.find("input:text").keydown(function(evt) { if (evt.keyCode == 13) return false; });
			
		    form.find('[role=hint]').remove();
			$.each(form.find('input , select'),function(i,el){
				
				var $el = $(el);
				var $target = $el.closest('td');
				var h_key = ($el.attr('id') || $el.attr('id'));
				util.renderHint($target,h_key);
			});
	    	
	    };
	    init();
	    form.find('input, select').on('focusout',function(e){
			var $self = $(this);
			util.renderValidate($self);
			
		});
		$('#password_change').on('click',function(e){
			e.preventDefault();
			e.stopPropagation();
			
			var pwdPop = new pwdEdit($('#clayServer'),$('#password'));
			pwdPop.open();
			
		});
		$('#config_save').on('click',function(e){
			var $self = $(this);
			
			var isSend = util.renderValidateAll(form.find('input, select'));
			if(isSend){
				var newData = form.serializeArray();
				var params = {};
				$.each(newData ,function(i,obj){
					params[obj['name']] = obj['value'];
					
				});
				var sendConfig = util.sendReq('setConfig',params);
				
				sendConfig.done(function(result){
					if(!result['ok']){
						util.showPopup(result['error']);
					} else {
						util.showPopup('Success');
					}
				});
			}
			
		});
		$('#config_cancel').on('click',function(e){
			var name,val;
			$.each(oldData,function(i,obj){
				
				name= obj['name'];
				val = obj['value'];
				$('[name='+name+']').val(val).prop('checked',true);
			});
			
			form.find('p.messageBox , .fa-check').remove();
			
		});
	    
	    
	    
    }
);
