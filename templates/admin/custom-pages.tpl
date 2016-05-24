<div class="row">
    <div class="col-sm-2 col-xs-12 settings-header">Active Routes</div>
    <div class="col-sm-10 col-xs-12">
        <p class="lead">
            Define and customise your new routes here.
        </p>
        <p>
            Once restarted, you will be able to add content to your new routes from <a href="{config.relative_path}/admin/extend/widgets">Extend &rarr; Widgets</a>.
        </p>
        <p>
            By default, your routes are only accessible if you know the URL. You can add your new route to the site navigation from <a href="{config.relative_path}/admin/general/navigation">General &rarr; Navigation</a>
        <div id="custom-pages">
            <!-- BEGIN pages -->
            <div class="well">
                <form>
                    <span class="pull-right"><i class="fa fa-times pointer"></i></span>

                    <label>Name of page
                    <input type="text" class="form-control" name="name" value="{pages.name}" />
                    </label>

                    <label>Route (no spaces)
                    <input type="text" class="form-control" name="route" value="{pages.route}" />
                    </label>

                    <label>Custom CSS Class
                    <input type="text" class="form-control" name="class" value="{pages.class}" />
                    </label>
                </form>
            </div>
            <!-- END pages -->
        </div>
    </div>
</div>

<div class="template well hidden">
    <form>
        <span class="pull-right"><i class="fa fa-times pointer"></i></span>

        <label>Name of page
        <input type="text" class="form-control" name="name" value="" />
        </label>

        <label>Route (no spaces)
        <input type="text" class="form-control" name="route" value="" />
        </label>

        <label>Custom CSS Class
        <input type="text" class="form-control" name="class" value="" />
        </label>
    </form>
</div>

<div class="floating-button">
    <button id="add" class="success mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
        <i class="material-icons">note_add</i>
    </button>
    <button id="save" class="primary btn-primary mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
        <i class="material-icons">save</i>
    </button>
</div>

<script>
    function addCloseHandler() {
        $('#custom-pages .fa-times').on('click', function() {
            $(this).parents('.well').remove();
        });
    }

    $('#add').on('click', function(ev) {
        var clone = $('.template').clone().removeClass('template hidden');
        $('#custom-pages').append(clone);

        addCloseHandler();
    });

    addCloseHandler();

    $('#save').on('click', function(ev) {
        var arr = [];
        $('#custom-pages .well form').each(function() {
            var data = $(this).serializeArray();
            if (data[1].value && !data[1].value.match(' ') && data[1].value !== '') {
                arr.push({
                    name: data[0].value,
                    route: data[1].value,
                    class: data[2].value
                });
            }
            
            
        });

        socket.emit('admin.settings.saveCustomPages', arr, function() {
            app.alertSuccess('Custom pages saved and activated');
        });
    });
</script>