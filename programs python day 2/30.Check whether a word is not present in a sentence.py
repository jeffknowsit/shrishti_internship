sentence="hi this is tis oj "
list1=sentence.split()
a=input("Enter Word")
found=0
for i in list1:
    if(a.lower()==i):
        print("found word in list")
        found=1
        break;
if(found==0):
    print("word not found")
