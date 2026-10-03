<div class="form-group">
<label class="block text-sm font-bold text-gray-700 mb-2"><?php echo get_phrase('section');?></label>
    <select name="section_id" id="section_id" class="bg-white border-2 border-gray-300 text-gray-900 text-base rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-3 h-[46px]">
        <?php 
            $sections = $this->db->get_where('section' , array(
                'class_id' => $class_id 
            ))->result_array();
            foreach($sections as $row):
        ?>
        <option value="<?php echo $row['section_id'];?>"><?php echo $row['name'];?></option>
        <?php endforeach;?>
    </select>
</div>

<script type="text/javascript">

    $(document).ready(function () {

        // SelectBoxIt Dropdown replacement
        if ($.isFunction($.fn.selectBoxIt))
        {
            $("select.selectboxit").each(function (i, el)
            {
                var $this = $(el),
                        opts = {
                            showFirstOption: attrDefault($this, 'first-option', true),
                            'native': attrDefault($this, 'native', false),
                            defaultText: attrDefault($this, 'text', ''),
                        };

                $this.addClass('visible');
                $this.selectBoxIt(opts);
            });
        }

    });

</script>