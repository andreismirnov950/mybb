var Thread = {
	init: function()
	{
		Thread.qeCache = new Array();
		Thread.initMultiQuote();
		Thread.initQuickReply();
	},

	initMultiQuote: function()
	{
		var quoted = Cookie.get("multiquote");
		if(quoted)
		{
			var post_ids = quoted.split("|");
			post_ids.each(function(post_id) {
				if($("multiquote_"+post_id))
				{
					element = $("multiquote_"+post_id);
					element.src = element.src.replace("postbit_multiquote.gif", "postbit_multiquote_on.gif");
				}
			});
			if($('quickreply_multiquote'))
			{
				$('quickreply_multiquote').style.display = '';
			}
		}
		return true;
	},

	multiQuote: function(pid)
	{
		var new_post_ids = new Array();
		var quoted = Cookie.get("multiquote");
		var is_new = true;
		if(quoted)
		{
			var post_ids = quoted.split("|");
			post_ids.each(function(post_id) {
				if(post_id != pid && post_id != '')
				{
					new_post_ids[new_post_ids.length] = post_id;
				}
				else if(post_id == pid)
				{
					is_new = false;
				}
			});
		}
		element = $("multiquote_"+pid);
		if(is_new == true)
		{
			element.src = element.src.replace("postbit_multiquote.gif", "postbit_multiquote_on.gif");
			new_post_ids[new_post_ids.length] = pid;
		}
		else
		{
			element.src = element.src.replace("postbit_multiquote_on.gif", "postbit_multiquote.gif");
		}
		if($('quickreply_multiquote'))
		{
			if(new_post_ids.length > 0)
			{
				$('quickreply_multiquote').style.display = '';
			}
			else
			{
				$('quickreply_multiquote').style.display = 'none';
			}
		}
		Cookie.set("multiquote", new_post_ids.join("|"));
	},

	loadMultiQuoted: function(tid)
	{
		if(use_xmlhttprequest == "yes")
		{
			this.spinner = new ActivityIndicator("body", {image: "images/spinner_big.gif"});
			new ajax('xmlhttp.php?action=get_multiquoted&load_all=1', {method: 'get', onComplete: function(request) {Thread.multiQuotedLoaded(request); }});
		}
		else
		{
			document.location = './newreply.php?tid=' + tid;
		}
	},

	multiQuotedLoaded: function(request)
	{
		if(request.responseText.match(/<error>(.*)<\/error>/))
		{
			message = request.responseText.match(/<error>(.*)<\/error>/);
			if(!message[1])
			{
				message[1] = "An unknown error occurred.";
			}
			alert('There was an error fetching the posts.\n\n'+message[1]);
		}
		else if(request.responseText)
		{
			var id = 'message';
			if(typeof clickableEditor != 'undefined')
			{
				id = clickableEditor.textarea;
			}
			if($(id).value)
			{
				$(id).value += "\n";
			}
			$(id).value += request.responseText;
		}
		Thread.clearMultiQuoted();
		$('quickreply_multiquote').style.display = 'none';
		document.input.quoted_ids.value = 'all';
		this.spinner.destroy();	
		this.spinner = '';
		$('message').focus();	
	},

	clearMultiQuoted: function()
	{
		$('quickreply_multiquote').style.display = 'none';
		var quoted = Cookie.get("multiquote");
		if(quoted)
		{
			var post_ids = quoted.split("|");
			post_ids.each(function(post_id) {
				if($("multiquote_"+post_id))
				{
					element = $("multiquote_"+post_id);
					element.src = element.src.replace("postbit_multiquote_on.gif", "postbit_multiquote.gif");
				}
			});
		}
		Cookie.unset('multiquote');
	},	

	deletePost: function(pid)
	{
		confirmReturn = confirm(quickdelete_confirm);
		if(confirmReturn == true) {
			form = document.createElement("form");
			form.setAttribute("method", "post");
			form.setAttribute("action", "editpost.php?action=deletepost&delete=yes");
			form.setAttribute("style", "display: none;");

			var input = document.createElement("input");
			input.setAttribute("name", "pid");
			input.setAttribute("type", "hidden");
			input.setAttribute("value", pid);

			form.appendChild(input);
			document.getElementsByTagName("body")[0].appendChild(form);
			form.submit();
		}
	},

	reportPost: function(pid)
	{
		MyBB.popupWindow("report.php?pid="+pid, "reportPost", 400, 300)
	},

	quickEdit: function(pid)
	{
		if(!$("pid_"+pid))
		{
			return false;
		}
		if(Thread.qeCache[pid])
		{
			return false;
		}
		Thread.qeCache[pid] = $("pid_"+pid).innerHTML;
		this.spinner = new ActivityIndicator("body", {image: "images/spinner_big.gif"});
		new ajax('xmlhttp.php?action=edit_post&do=get_post&pid='+pid, {method: 'get', onComplete: function(request) { Thread.quickEditLoaded(request, pid); }});
		return false;
	},

	quickEditLoaded: function(request, pid)
	{
		if(request.responseText.match(/<error>(.*)<\/error>/))
		{
			message = request.responseText.match(/<error>(.*)<\/error>/);
			if(!message[1])
			{
				message[1] = "An unknown error occurred.";
			}
			alert('There was an error performing the update.\n\n'+message[1]);
			Thread.qeCache[pid] = "";
		}
		else if(request.responseText)
		{
			$("pid_"+pid).innerHTML = request.responseText;
			element = $("quickedit_"+pid);
			element.focus();
			offsetTop = -60;
			do
			{
				offsetTop += element.offsetTop || 0;
				element = element.offsetParent;
			}
			while(element);

			scrollTo(0, offsetTop);
		}
		this.spinner.destroy();	
		this.spinner = '';	
	},

	quickEditSave: function(pid)
	{
		message = $("quickedit_"+pid).value;
		if(message == "")
		{
			return false;
		}
		this.spinner = new ActivityIndicator("body", {image: "images/spinner_big.gif"});
		
		postData = "value="+encodeURIComponent(message).replace(/\+/g, "%2B");
		new ajax('xmlhttp.php?action=edit_post&do=update_post&pid='+pid, {method: 'post', postBody: postData, onComplete: function(request) { Thread.quickEditSaved(request, pid); }});
	},

	quickEditCancel: function(pid)
	{
		$("pid_"+pid).innerHTML = Thread.qeCache[pid];
		Thread.qeCache[pid] = "";
		if(this.spinner)
		{
			this.spinner.destroy();
			this.spinner = '';
		}
	},

	quickEditSaved: function(request, pid)
	{
		if(request.responseText.match(/<error>(.*)<\/error>/))
		{
			message = request.responseText.match(/<error>(.*)<\/error>/);
			if(!message[1])
			{
				message[1] = "An unknown error occurred.";
			}
			alert('There was an error performing the update.\n\n'+message[1]);
		}
		else if(request.responseText)
		{
			$("pid_"+pid).innerHTML = request.responseText;
		}
		Thread.qeCache[pid] = "";
		this.spinner.destroy();
		this.spinner = '';
	},

	initQuickReply: function()
	{
		if($('quick_reply_form'))
		{
			Event.observe($('quick_reply_form'), "submit", Thread.quickReply.bindAsEventListener(this));
		}
	},

	quickReply: function(e)
	{
		Event.stop(e);

		if(this.quick_replying)
		{
			return false;
		}

		this.quick_replying = 1;
		var post_body = Form.serialize('quick_reply_form');
		this.spinner = new ActivityIndicator("body", {image: "images/spinner_big.gif"});
		new ajax('newreply.php?ajax=1', {method: 'post', postBody: post_body, onComplete: function(request) { Thread.quickReplyDone(request); }});
		return false;
	},

	quickReplyDone: function(request)
	{
		if(request.responseText.match(/<error>(.*)<\/error>/))
		{
			message = request.responseText.match(/<error>(.*)<\/error>/);

			if(!message[1])
			{
				message[1] = "An unknown error occurred.";
			}

			alert('There was an error posting your reply:\n\n'+message[1]);
		}
		else if(request.responseText.match(/id="post_([0-9]+)"/))
		{
			var pid = request.responseText.match(/id="post_([0-9]+)"/)[1];
			var post = document.createElement("div");
			post.innerHTML = request.responseText;
			$('posts').appendChild(post);
			if(MyBB.browser == "ie")
			{
				request.responseText.evalScripts();
			}
			Form.reset('quick_reply_form');
			if($('lastpid'))
			{
				$('lastpid').value = pid;
			}
		}
		else
		{
			request.responseText.evalScripts();
		}
		if(this.spinner)
		{
			this.spinner.destroy();
			this.spinner = '';
		}
		this.quick_replying = 0;
	}
};
Event.observe(window, 'load', Thread.init);