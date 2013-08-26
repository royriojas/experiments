;(function ($, kno, window) {

  var TweenMax = window.TweenMax;

  kno.on('app:ready',function (e, params) {
    var $ryu = $('.ryu');
    var $avatarFemale = $('#avatar-female');
    var $doc = params.$doc;

    $doc.on('tap', function (e) {
      $ryu.removeClass('anim-idle');
      $ryu.addClass('anim-arms-up');
      TweenMax.to($ryu, 1, {
        x: e.gesture.center.pageX,
        y: e.gesture.center.pageY,
        onComplete : function () {
          //$ryu.attr('data-state', 'iddle');
          $ryu.removeClass('anim-arms-up');
          $ryu.addClass('anim-idle');
        }
      });

      $avatarFemale.removeClass('anim-idle');
      $avatarFemale.addClass('anim-walk-right');
      TweenMax.to($avatarFemale, 1, {
        x: e.gesture.center.pageX,
        y: e.gesture.center.pageY,
        onComplete: function () {
          //$ryu.attr('data-state', 'iddle');
          $avatarFemale.removeClass('anim-walk-right');
          $avatarFemale.addClass('anim-idle');
        }
      });
    });

  });


	//this is always at the end
	kno.fire('app:init', { SPA: false });

}(jQuery, kno, window));