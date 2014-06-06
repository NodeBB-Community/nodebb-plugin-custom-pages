<h1>Custom Static Pages</h1>
<hr />

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

<button class="btn btn-lg btn-success" id="add">Add New Page</button>
<button class="btn btn-lg btn-primary" id="save">Save</button>

<script>
$('#add').on('click', function(ev) {
    var clone = $('.template').clone().removeClass('template hidden');
    $('#custom-pages').append(clone);

    $('#custom-pages .fa-times').on('click', function() {
        $(this).parents('.well').remove();
    });
});

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
        app.alertSuccess('Saved custom pages - please restart your forum to activate the new routes.');
    });
});
</script>